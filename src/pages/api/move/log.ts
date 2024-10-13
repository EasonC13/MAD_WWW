// pages/api/move/log.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db/postgres-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { bytecode, package_id, module_name, status, decompiled_text } =
    req.body;

  try {
    const result = await query(
      "INSERT INTO openai_log(bytecode, package_id, module_name, decompiled_text, timestamp) VALUES($1, $2, $3, $4, NOW()) RETURNING *",
      [bytecode, package_id, module_name, decompiled_text || ""]
    );

    res
      .status(200)
      .json({ message: "Log saved successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Failed to save log", error);
    res.status(500).json({ message: "Failed to save log" });
  }
}
