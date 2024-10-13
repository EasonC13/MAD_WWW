// src/pages/api/move/create_prompt_input.ts

/**
 * @swagger
 * /api/move/create_prompt_input:
 *   post:
 *     summary: Decompile Move bytecode.
 *     description: Create prompt input for Move bytecode chunks for further decompile.
 *     tags:
 *       - Decompiler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               move_base64:
 *                 type: string
 *                 description: The Move bytecode in base64 encoding.
 *               openai_api_key:
 *                 type: string
 *                 description: OpenAI API key or a voucher code for service access.
 *               digest:
 *                 type: string
 *                 description: Digest string to identify the transaction.
 *               user:
 *                 type: string
 *                 description: Optional user identifier for tracking.
 *             required:
 *               - move_base64
 *     responses:
 *       200:
 *         description: Decompilation successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Decompilation successful
 *                 decompiled_by_algorithm:
 *                   type: object
 *                   description: Decompiled code categorized by algorithm.
 *                   properties:
 *                     first_line:
 *                       type: string
 *                       example: "// Decompiled by MoveAiBot\n..."
 *                     struct:
 *                       type: array
 *                       items:
 *                         type: string
 *                 byte_need_further_processing:
 *                   type: object
 *                   description: Bytecode that needs further processing categorized by function type.
 *                   properties:
 *                     init:
 *                       type: array
 *                       items:
 *                         type: string
 *                     internal:
 *                       type: array
 *                       items:
 *                         type: string
 *                     public:
 *                       type: array
 *                       items:
 *                         type: string
 *                 contract_header_that_need_further_processing:
 *                   type: object
 *                   description: Headers of contract blocks that need further processing.
 *                   properties:
 *                     init:
 *                       type: array
 *                       items:
 *                         type: string
 *                     internal:
 *                       type: array
 *                       items:
 *                         type: string
 *                     public:
 *                       type: array
 *                       items:
 *                         type: string
 *                 contract_interface:
 *                   type: object
 *                   description: Interface of contract blocks.
 *                   properties:
 *                     init:
 *                       type: array
 *                       items:
 *                         type: string
 *                     internal:
 *                       type: array
 *                       items:
 *                         type: string
 *                     public:
 *                       type: array
 *                       items:
 *                         type: string
 *                 useStatements:
 *                   type: array
 *                   items:
 *                     type: string
 *                 packageReplacementMap:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                 dataReplacementMap:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                 encryptedBytecodeHash:
 *                   type: string
 *       400:
 *         description: Invalid input parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: openai_api_key or digest is required
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 *     security:
 *       - apiKeyAuth: []
 */

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import {
  encryptWithAES256CBC,
  calculateSHA256,
} from "../../../lib/encrypt_utils";
import { extractUseStatementsAndPackageMap } from "../../../lib/api/create_prompt_input/extractUseStatementsAndPackageMap";
import { getDataReplacementMap } from "../../../lib/api/create_prompt_input/getDataReplacementMap";
import { processDecompiledCodeToBlocks } from "../../../lib/api/create_prompt_input/processDecompiledCodeToBlocks";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { getPaidFee } from "../../../lib/api/create_prompt_input/getPaidFee";
import { count_function_amount } from "@/lib/count_function_amount";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { corsMiddleware } from "@/lib/utils/cors";
import { getFunctionNamesInOrder } from "@/lib/api/create_prompt_input/getFunctionNamesInOrder";

interface PostBody {
  move_base64?: string;
  openai_api_key?: string;
  digest?: string;
  signature?: string;
  user?: string;
}

type Data = {
  message: string;
  // decompiled_code?: string;
  decompiled_by_algorithm: any;
  byte_need_further_processing: any;
  contract_header_that_need_further_processing: any;
  useStatements: any;
  packageReplacementMap: any;
};

async function validateSignature(signature: string) {
  if (signature.length > 1) {
    return true;
  }
  return false;
}

let getHeader = (block: string) => {
  return block.trimStart().split("(")[0].split("<")[0];
};
let getInterface = (block: string) => {
  let f = block.trimStart().split("\n")[0];
  return `${f}\n        abort 0\n    }`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | any>
) {
  corsMiddleware(req, res);
  const prisma = new PrismaClient().$extends(withAccelerate());

  if (req.method === "POST") {
    let { move_base64, openai_api_key, digest, user, signature }: PostBody =
      req.body;
    const PASSWORDS: string[] = JSON.parse(process.env.PASSWORDS || "");

    let callType = "";

    if (signature && (await validateSignature(signature))) {
      callType = "Valid to use service's key by signature";
    } else if (!openai_api_key && digest == undefined) {
      res.status(400).json({ message: "openai_api_key or digest is required" });
      return;
    } else if (openai_api_key && !openai_api_key?.startsWith("sk-")) {
      let voucher = await prisma.voucher.findFirst({
        where: {
          code: openai_api_key || "DUMMY Not Found",
        },
      });
      if (
        voucher &&
        voucher.used_count < voucher.total_count &&
        [null, "", user].includes(voucher.user)
      ) {
        callType = "Valid to use service's key for free";
        await prisma.voucher.update({
          where: {
            id: voucher.id,
          },
          data: {
            used_count: {
              increment: 1,
            },
            history: {
              create: {
                user: user || "",
              },
            },
          },
        });
      } else if (voucher && voucher.used_count >= voucher.total_count) {
        res.status(400).json({ message: "No remaining count" });
        return;
      } else {
        res.status(400).json({ message: "Invalid voucher" });
        return;
      }
    } else {
      if (openai_api_key?.startsWith("sk-")) {
        // let { fee, coinType, sender } = await getPaidFee({
        //   digest: digest || "",
        // });
        // if (fee < 1 * 10 ** 9) {
        //   res.status(400).json({ message: "Insufficient fee" });
        //   return;
        // }
        callType = "Valid to use own key";
        // prisma.paymentTransaction
        //   .create({
        //     data: {
        //       tx_digest: digest || "",
        //       amount: fee,
        //       coin_type: coinType,
        //       sender,
        //       note: callType,
        //     },
        //   })
        //   .then((result) => {});
      } else {
        callType = "Valid to use service's key by payment";
      }
    }

    if (!move_base64) {
      res.status(400).json({ message: "move_base64 is required" });
      return;
    }

    try {
      const [response, functionNamesInOrder] = await Promise.all([
        axios.post(
          "https://backend.backup.suigpt.tools/decompile_move_bytecode",
          {
            bytecode: move_base64,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
        getFunctionNamesInOrder(move_base64),
      ]);

      const { data } = response;
      if (!data) {
        res.status(500).json({ message: "Failed to disassemble bytecode" });
      }
      let processed_decompile_code = data.decompiled_code;

      const function_count = count_function_amount(processed_decompile_code);

      let paymentSender = "";
      if (callType == "Valid to use service's key by payment") {
        const { fee, coinType, sender } = await getPaidFee({
          digest: digest || "",
        });
        paymentSender = sender;
        const amount_to_input = function_count * 0.3 * 10 ** 9;
        if (fee < amount_to_input) {
          res.status(400).json({ message: "Insufficient fee" });
          return;
        }
        prisma.paymentTransaction
          .create({
            data: {
              tx_digest: digest || "",
              amount: fee,
              coin_type: coinType,
              sender,
              note: callType,
            },
          })
          .then((result) => {});
      }

      const { dataReplacementMap } = getDataReplacementMap(
        processed_decompile_code
      );
      for (const [key, value] of Object.entries(dataReplacementMap)) {
        processed_decompile_code = processed_decompile_code.replace(value, key);
      }

      const [decompiled_code, blocksWithCategories] =
        processDecompiledCodeToBlocks(processed_decompile_code);

      // sort the blocksWithCategories['functions'] by functionNamesInOrder
      const functions = blocksWithCategories.get("functions");
      if (functions) {
        const sortedFunctions = functions.sort((a, b) => {
          const indexA = functionNamesInOrder.indexOf(
            getHeader(a).replace(" fun", "")
          );
          const indexB = functionNamesInOrder.indexOf(
            getHeader(b).replace(" fun", "")
          );
          return indexA - indexB;
        });
        blocksWithCategories.set("functions", sortedFunctions);
      }

      const encryptedBlockWithCategories: Map<string, string[]> = new Map();
      const timestamp = Date.now();

      const bytecode_hash = calculateSHA256(move_base64);
      const encryptedBytecodeHash = encryptWithAES256CBC(
        bytecode_hash,
        process.env.ENCRYPTION_KEY || "",
        "0000000000000000"
      );

      blocksWithCategories.forEach((value: string[], key: string) => {
        encryptedBlockWithCategories.set(
          key,
          value.map((block) => {
            const message = JSON.stringify({
              block,
              timestamp,
              callType,
            });
            return encryptWithAES256CBC(
              message,
              process.env.ENCRYPTION_KEY || "",
              "0000000000000000"
            );
          })
        );
      });
      let prefix = "";
      if (paymentSender) {
        let suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
        const result = await suiClient.resolveNameServiceNames({
          address: paymentSender,
        });
        if (result.data) {
          paymentSender = result.data[0];
        }

        prefix += `// API Fee paid by ${paymentSender}\n`;
      }
      const decompiled_by_algorithm = {
        first_line: prefix + decompiled_code.split("\n")[0],
        struct: blocksWithCategories.get("struct"),
      };
      const byte_need_further_processing = {
        functions: encryptedBlockWithCategories.get("functions"),
      };

      const contract_header_that_need_further_processing = {
        functions: blocksWithCategories.get("functions")?.map(getHeader),
      };
      const contract_interface = {
        functions: blocksWithCategories.get("functions")?.map(getInterface),
      };
      const { useStatements, packageReplacementMap } =
        extractUseStatementsAndPackageMap(decompiled_code);

      res.status(200).json({
        message: "Decompilation successful",
        decompiled_by_algorithm,
        byte_need_further_processing,
        contract_header_that_need_further_processing,
        contract_interface,
        useStatements,
        packageReplacementMap,
        dataReplacementMap,
        encryptedBytecodeHash,
      });
    } catch (error) {
      console.error("Axios request failed:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
