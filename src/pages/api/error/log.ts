import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { message, context } = req.body;

  try {
    const result = await prisma.errorLog.create({
      data: {
        message,
        context,
      },
    });

    return res
      .status(200)
      .json({ message: "Log saved successfully", data: result });
  } catch (error) {
    console.error("Failed to save log", error);
    return res.status(500).json({ message: "Failed to save log" });
  }
}
