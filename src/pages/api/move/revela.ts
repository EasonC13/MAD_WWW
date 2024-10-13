import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { corsMiddleware } from "@/lib/utils/cors";

/**
 * @swagger
 * /api/move/revela:
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
 *                 decompiled_code:
 *                   type: string
 *                   example: // Decompiled Move code
 *       400:
 *         description: Invalid input parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: move_base64 is required
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
 */

interface PostBody {
  move_base64?: string;
}

type Data = {
  message: string;
  decompiled_code?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await corsMiddleware(req, res);

  if (req.method === "POST") {
    let { move_base64 }: PostBody = req.body;

    if (!move_base64) {
      res.status(400).json({ message: "move_base64 is required" });
      return;
    }

    try {
      const response = await axios.post(
        "https://backend.backup.suigpt.tools/decompile_move_bytecode",
        {
          bytecode: move_base64,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;
      if (!data || !data.decompiled_code) {
        res.status(500).json({ message: "Failed to disassemble bytecode" });
        return;
      }

      res.status(200).json({
        message: "Decompilation successful",
        decompiled_code: data.decompiled_code,
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
