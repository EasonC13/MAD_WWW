/**
 * @swagger
 * /api/decompiler/package/{package_id}:
 *   get:
 *     summary: Retrieve decompiled Move code for all modules in a package
 *     description: Fetch all decompiled Move code for a specific package. If a module's decompiled code is not available, return a decompilation link.
 *     tags:
 *       - MoveAiBot
 *     parameters:
 *       - in: path
 *         name: package_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the package
 *         example: "0x437eeb92f9a14ad1fe850b09f387865d14861ee190ab34d324cb6941c534a7b9"
 *       - in: query
 *         name: network
 *         required: false
 *         schema:
 *           type: string
 *         description: The network of the package (mainnet, testnet, or devnet)
 *         example: "mainnet"
 *     responses:
 *       200:
 *         description: Successfully retrieved all decompiled code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 decompiledModules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       moduleName:
 *                         type: string
 *                       decompiledCode:
 *                         type: string
 *                         nullable: true
 *                       go_decompile_url:
 *                         type: string
 *                         nullable: true
 *                         description: Decompilation link if code is missing
 *       404:
 *         description: Package not found or invalid
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { PrismaClient } from "@prisma/client";
import Cors from "cors";
import { calculateSHA256 } from "@/lib/encrypt_utils";

const prisma = new PrismaClient();

// Initialize the CORS middleware
const cors = Cors({
  methods: ["GET", "HEAD"],
  origin: "*", // Allow all origins
});

// Helper method to run middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method === "GET") {
    const { package_id } = req.query;

    const network = req.query.network || "mainnet";

    if (!package_id || typeof package_id !== "string") {
      return res.status(400).json({ error: "Invalid package_id" });
    }

    try {
      // Initialize the SuiClient to fetch module names
      const suiClient = new SuiClient({
        url: getFullnodeUrl(network as "mainnet" | "testnet" | "devnet"),
      });

      // Fetch the package's data to get the list of module names
      const pkg: any = await suiClient.getObject({
        id: package_id,
        options: { showBcs: true },
      });

      if (!pkg.data || !pkg.data.bcs || !pkg.data.bcs.moduleMap) {
        return res.status(404).json({ error: "Package not found or invalid" });
      }

      const moduleNames = Object.keys(pkg.data.bcs.moduleMap);

      // Fetch decompiled code for each module
      const decompiledModules = await Promise.all(
        moduleNames.map(async (moduleName) => {
          const decompiledCode = await prisma.decompiledCode.findFirst({
            where: {
              packageId: package_id as string,
              moduleName,
              network: network as string,
            },
            orderBy: {
              timestamp: "desc",
            },
          });

          if (decompiledCode) {
            return {
              moduleName,
              decompiledCode: decompiledCode.decompiledCode,
              go_decompile_url: null,
            };
          } else {
            const protocol = req.headers["x-forwarded-proto"] || "http";
            const host = req.headers.host || "localhost";
            const baseUrl = `${protocol}://${host}`;
            return {
              moduleName,
              decompiledCode: null,
              go_decompile_url: `${baseUrl}/decompile/${package_id}?network=${network}&module=${moduleName}&language=suigpt_decompiled`,
            };
          }
        })
      );
      let packagesNeedFurtherDecompile = decompiledModules.filter(
        (module) => module.decompiledCode === null
      );

      let isNeedFurtherDecompile = packagesNeedFurtherDecompile.length > 0;
      if (isNeedFurtherDecompile) {
        // If direct lookup failed, try finding by bytecode hash
        const bytecodeHashes = await Promise.all(
          packagesNeedFurtherDecompile.map(async (module) => {
            const moduleBytecode = pkg.data.bcs.moduleMap[module.moduleName];
            if (moduleBytecode) {
              return calculateSHA256(moduleBytecode);
            }
            return null;
          })
        );

        const decompiledByHash = await Promise.all(
          bytecodeHashes.map(async (hash, index) => {
            if (!hash) return null;
            const decompiledCode = await prisma.decompiledCode.findFirst({
              where: {
                bytecodeHash: hash,
              },
              orderBy: {
                timestamp: "desc",
              },
            });
            if (decompiledCode) {
              return {
                moduleName: packagesNeedFurtherDecompile[index].moduleName,
                decompiledCode: decompiledCode.decompiledCode,
                go_decompile_url: null,
              };
            }
            return null;
          })
        );

        // Update decompiledModules with any matches found by hash
        decompiledByHash.forEach((result, index) => {
          if (result) {
            const moduleIndex = decompiledModules.findIndex(
              (m) => m.moduleName === result.moduleName
            );
            if (moduleIndex !== -1) {
              decompiledModules[moduleIndex] = result;
            }
          }
        });

        // Recalculate packages that still need further decompilation
        packagesNeedFurtherDecompile = decompiledModules.filter(
          (module) => module.decompiledCode === null
        );
        isNeedFurtherDecompile = packagesNeedFurtherDecompile.length > 0;
      }

      res.status(200).json({
        isNeedFurtherDecompile,
        packagesNeedFurtherDecompile,
        decompiledModules,
      });
    } catch (error) {
      console.error("Error fetching decompiled modules:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
