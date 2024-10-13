import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import {
  encryptWithAES256CBC,
  calculateSHA256,
} from "../../../lib/encrypt_utils";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { getPaidFee } from "../../../lib/api/create_prompt_input/getPaidFee";

interface PostBody {
  prompt_messages?: any;
  openai_api_key?: string;
  digest?: string;
  signature?: string;
  user?: string;
}

type Data = {
  message: string;
  auth_message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | any>
) {
  const prisma = new PrismaClient().$extends(withAccelerate());

  if (req.method === "POST") {
    let { prompt_messages, openai_api_key, digest, user }: PostBody = req.body;
    let callType = "";

    if (!openai_api_key && digest == undefined) {
      res.status(400).json({ message: "openai_api_key or digest is required" });
      return;
    }
    // TODO: this is a HACK for SUI hackthon only, remove later
    else if (openai_api_key && openai_api_key == "sui_copilot") {
      callType = "sui_copilot";
    } else if (openai_api_key && !openai_api_key.startsWith("sk-")) {
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
        // if (fee < 0.1 * 10 ** 9) {
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
        let { fee, coinType, sender } = await getPaidFee({
          digest: digest || "",
        });
        console.log({ digest, fee, coinType, sender });
        if (fee < 1 * 10 ** 9) {
          res.status(400).json({ message: "Insufficient fee" });
          return;
        }
        callType = "Valid to use service's key by payment";
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
    }
    let timestamp = Date.now();
    let prompt_messages_sha256 = calculateSHA256(
      JSON.stringify(prompt_messages || "")
    );
    const message = JSON.stringify({
      prompt_messages_sha256,
      timestamp,
      callType,
    });
    let auth_message = encryptWithAES256CBC(
      message,
      process.env.ENCRYPTION_KEY || "",
      "0000000000000000"
    );
    res.status(200).json({ message: "Success", auth_message });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
