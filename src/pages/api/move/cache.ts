import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

import crypto from "crypto";
import { calculateSHA256, decryptWithAES256CBC } from "@/lib/encrypt_utils";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {
      bytecode,
      decompiledCode,
      encryptedBytecodeHash,
      network,
      moduleName,
      packageId,
    } = req.body;

    if (!bytecode || !decompiledCode || !encryptedBytecodeHash) {
      return res.status(400).json({
        message:
          "bytecode, decompiledCode, and encryptedBytecodeHash are required",
      });
    }

    const decryptedBytecodeHash = decryptWithAES256CBC(
      encryptedBytecodeHash,
      process.env.ENCRYPTION_KEY || "",
      "0000000000000000"
    );

    const bytecodeHash = calculateSHA256(bytecode);

    if (decryptedBytecodeHash !== bytecodeHash) {
      return res.status(400).json({ message: "Invalid bytecode" });
    }

    try {
      const existingCache = await prisma.decompiledCode.findMany({
        where: {
          bytecodeHash,
          modelVersion: process.env.SUIGPT_MODEL_VERSION,
          network,
          moduleName,
          packageId,
        },
      });
      let cache;
      if (existingCache.length != 0) {
        cache = await prisma.decompiledCode.update({
          where: {
            id: existingCache[0].id,
          },
          data: {
            bytecodeHash,
            decompiledCode,
            modelVersion: process.env.SUIGPT_MODEL_VERSION || "",
            network,
            moduleName,
            packageId,
          },
        });
      } else {
        cache = await prisma.decompiledCode.create({
          data: {
            bytecodeHash,
            decompiledCode,
            modelVersion: process.env.SUIGPT_MODEL_VERSION || "",
            network,
            moduleName,
            packageId,
          },
        });
      }

      return res.status(200).json({ message: "Cache created", cache });
    } catch (error) {
      console.error("Failed to create cache", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    const { bytecodeHash } = req.query;

    if (!bytecodeHash) {
      return res.status(400).json({ message: "bytecodeHash is required" });
    }

    try {
      const cache = await prisma.decompiledCode.findFirst({
        where: {
          bytecodeHash: String(bytecodeHash),
          modelVersion: process.env.SUIGPT_MODEL_VERSION,
        },
      });

      if (!cache) {
        return res.status(404).json({ message: "Cache not found" });
      }

      return res.status(200).json(cache);
    } catch (error) {
      console.error("Failed to retrieve cache entry:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
