/**
 * @swagger
 * /api/move/module_names:
 *   get:
 *     summary: Retrieve module names for a Sui package
 *     description: Fetch the module names for a given package ID on a specified Sui network
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
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *         description: The Sui network to query (mainnet, testnet, or devnet)
 *         example: "mainnet"
 *     responses:
 *       200:
 *         description: Successfully retrieved module names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module_names:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of module names in the package
 *       400:
 *         description: Bad request - invalid package_id or network
 *       404:
 *         description: Package not found or invalid
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { package_id, network } = req.query;

    if (!package_id || typeof package_id !== "string") {
      return res.status(400).json({ error: "Invalid package_id" });
    }

    if (!network || typeof network !== "string") {
      return res.status(400).json({ error: "Invalid network" });
    }

    try {
      const suiClient = new SuiClient({
        url: getFullnodeUrl(network as "mainnet" | "testnet" | "devnet"),
      });

      const pkg: any = await suiClient.getObject({
        id: package_id,
        options: { showBcs: true },
      });

      if (!pkg.data || !pkg.data.bcs || !pkg.data.bcs.moduleMap) {
        return res.status(404).json({ error: "Package not found or invalid" });
      }

      const moduleNames = Object.keys(pkg.data.bcs.moduleMap);

      res.status(200).json({ module_names: moduleNames });
    } catch (error) {
      console.error("Error fetching module names:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
