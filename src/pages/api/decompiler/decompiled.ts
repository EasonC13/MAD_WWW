/**
 * @swagger
 * /api/decompiler/decompiled:
 *   get:
 *     summary: Retrieve decompiled Move code
 *     description: Fetch the most recent decompiled Move code for a specific package and module
 *     tags:
 *       - MoveAiBot
 *     parameters:
 *       - in: query
 *         name: package_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the package
 *         example: "0x437eeb92f9a14ad1fe850b09f387865d14861ee190ab34d324cb6941c534a7b9"
 *       - in: query
 *         name: module_name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the module
 *         example: "locker"
 *       - in: query
 *         name: network
 *         required: false
 *         schema:
 *           type: string
 *         description: The network of the package (defaults to mainnet if not specified)
 *         example: "mainnet"
 *         default: "mainnet"
 *     responses:
 *       200:
 *         description: Successfully retrieved decompiled code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 decompiledCode:
 *                   type: string
 *                   description: The decompiled Move code
 *       400:
 *         description: Bad request - missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message detailing the missing parameters
 *       404:
 *         description: Decompiled code not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the code was not found
 *                 go_decompile_url:
 *                   type: string
 *                   description: URL to trigger decompilation for the requested package and module
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the method is not allowed
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating an internal server error occurred
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { calculateSHA256 } from "@/lib/encrypt_utils";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { package_id, module_name, network } = req.query;

    if (!package_id || !module_name || !network) {
      return res
        .status(400)
        .json({ message: "package_id, module_name and network are required" });
    }

    try {
      const decompiledCode = await prisma.decompiledCode.findFirst({
        where: {
          packageId: String(package_id),
          moduleName: String(module_name),
          network: String(network),
        },
        orderBy: {
          timestamp: "desc",
        },
      });
      if (decompiledCode) {
        return res
          .status(200)
          .json({ decompiledCode: decompiledCode.decompiledCode });
      } else {
        // If no decompiledCode found, try to fetch the bytecode
        const suiClient = new SuiClient({
          url: getFullnodeUrl(String(network) as any),
        });
        try {
          const pkg: any = await suiClient.getObject({
            id: String(package_id),
            options: { showBcs: true },
          });

          if (
            pkg.data?.bcs?.moduleMap &&
            pkg.data.bcs.moduleMap[String(module_name)]
          ) {
            const bytecode = pkg.data.bcs.moduleMap[String(module_name)];
            const bytecodeHash = calculateSHA256(bytecode);

            // Try to find decompiledCode using bytecodeHash
            const decompiledCodeByHash = await prisma.decompiledCode.findFirst({
              where: {
                bytecodeHash: bytecodeHash,
              },
              orderBy: {
                timestamp: "desc",
              },
            });

            if (decompiledCodeByHash) {
              return res
                .status(200)
                .json({ decompiledCode: decompiledCodeByHash.decompiledCode });
            }
          }
        } catch (error) {
          console.error("Failed to fetch or process bytecode", error);
        }
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host || "localhost";
        const baseUrl = `${protocol}://${host}`;
        return res.status(404).json({
          message: "Decompiled code not found",
          go_decompile_url: `${baseUrl}/decompile/${package_id}?network=${network}&module=${module_name}&language=suigpt_decompiled`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch decompiled code", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
