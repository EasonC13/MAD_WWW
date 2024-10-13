import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

interface PostBody {
  move_base64?: string;
}

type Data = {
  message: string;
  move_disassembled?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "POST") {
    const { move_base64 }: PostBody = req.body;

    if (!move_base64) {
      res.status(400).json({ message: "move_base64 is required" });
      return;
    }

    try {
      const response = await axios.post(
        "https://backend.backup.suigpt.tools/disassemble_move_bytecode",
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
      if (data) {
        res.status(200).json({
          message: "Disassembly successful",
          move_disassembled: data.disassemble_code,
        });
      } else {
        res.status(500).json({ message: "Failed to disassemble bytecode" });
      }
    } catch (error) {
      console.error("Axios request failed:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
