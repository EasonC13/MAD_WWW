// src/pages/api/move/decompile_chunk.ts
/**
 * @swagger
 * /api/move/decompile_chunk:
 *   post:
 *     summary: Decompile Move Bytecode
 *     description: Decrypt and decompile a base64-encoded Move bytecode chunk from the /api/move/create_prompt_input call. Will return it as a readable stream.
 *     tags:
 *       - Decompiler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chunk_move_base64:
 *                 type: string
 *                 description: Base64-encoded Move bytecode chunk to be decompiled.
 *                 example: "QmFzZTY0IGVuY29kZWQgTW92ZSBieXRlY29kZQ=="
 *               openai_api_key:
 *                 type: string
 *                 description: API key for OpenAI service. Required unless callType validates free or paid service key.
 *                 example: "sk-..."
 *               signature:
 *                 type: string
 *                 description: Signature for request validation.
 *                 example: "signature_string"
 *               timestamp:
 *                 type: string
 *                 description: Timestamp of the request in milliseconds.
 *                 example: "1627891234567"
 *               callType:
 *                 type: string
 *                 description: Specifies the type of call (e.g., free or paid use of the service's key).
 *                 example: "Valid to use service's key for free"
 *     responses:
 *       200:
 *         description: Decompiled Move code successfully returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: Decompiled Move code in a readable format.
 *               example: "module M { ... }"
 *       400:
 *         description: Bad request due to invalid parameters or missing keys.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: "openai_api_key is required"
 *       401:
 *         description: Unauthorized request due to invalid OpenAI API key or timeout.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: "Invalid OpenAI API Key."
 *       500:
 *         description: Internal server error occurred during processing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: "Internal Server Error"
 *     security:
 *       - api_key: []
 */

import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import type { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prompt } from "@/lib/prompt_for_chunk";
import { decryptWithAES256CBC } from "../../../lib/encrypt_utils";
import { clear } from "console";
import { CORS_HEADERS } from "@/lib/utils/cors";
import { VALID_CALL_TYPES_TO_USE_SERVICE_KEY } from "@/constants/VALID_CALL_TYPES";

export const config = {
  runtime: "edge",
};

interface PostBody {
  chunk_move_base64?: string;
  openai_api_key?: string;
  signature: string;
  timestamp: string;
  callType: string;
}

export default async function handler(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const PASSWORDS: string[] = JSON.parse(process.env.PASSWORDS || "");
  if (req.method === "POST") {
    let { chunk_move_base64: chunk, openai_api_key }: PostBody =
      await req.json();

    let decompiled_move_chunk = "";
    try {
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
      const IV = "0000000000000000";

      const decrypted_chunk = decryptWithAES256CBC(
        chunk || "",
        ENCRYPTION_KEY,
        IV
      );
      const { block, timestamp, callType } = JSON.parse(decrypted_chunk);
      if (VALID_CALL_TYPES_TO_USE_SERVICE_KEY.includes(callType)) {
        openai_api_key = process.env.OPENAI_API_KEY || "";
      }
      if (Date.now() - parseInt(timestamp) > 3 * 60 * 1000) {
        return { message: "Request timeout" };
      }
      decompiled_move_chunk = block;
    } catch (error) {
      console.error("Error during decryption:", error);
      return { message: "Wrong Move Bytecode Provided" };
    }

    if (!openai_api_key) {
      return { message: "openai_api_key is required" };
    }

    const openai = new OpenAI({
      apiKey: openai_api_key,
    });
    try {
      await openai.models.list();
    } catch (error) {
      console.error({ message: "Invalid OpenAI API Key." + error });
      return { message: "Invalid OpenAI API Key." + error };
    }

    if (!chunk) {
      console.error({ message: "chunk_move_base64 is required" });
      return { message: "chunk_move_base64 is required" };
    }

    try {
      if (decompiled_move_chunk) {
        const messages = [
          ...prompt,
          {
            role: "user",
            content: `Here is the decompiled Move code block you need to convert:\n\`\`\`decompiled_move\n${decompiled_move_chunk}\`\`\``,
          },
        ];
        const response = await openai.chat.completions.create({
          model: process.env.CURRENT_MODEL || "chatgpt-4o-latest",
          messages: messages as any,
          stream: true,
          temperature: 0.00000000000000001,
          seed: parseInt(process.env.OPENAI_SEED || "123"),
        });

        const stream = OpenAIStream(response);
        // return new StreamingTextResponse(stream);
        const decoder = new TextDecoder();
        let total_text = "";

        return new StreamingTextResponse(
          new ReadableStream({
            async start(controller) {
              const reader = stream.getReader();
              const decoder = new TextDecoder("utf-8");

              const interval = setInterval(() => {
                if (total_text.includes("```rust")) {
                  controller.enqueue("");
                }
              }, 5000);

              try {
                while (true) {
                  const result = await reader.read();
                  if (result.done) {
                    clearInterval(interval);
                    controller.close();
                    break;
                  }
                  const textChunk = decoder.decode(result.value, {
                    stream: true,
                  });
                  total_text += textChunk;

                  controller.enqueue(result.value);
                }
              } catch (error) {
                console.error("Stream reading failed:", error);
                controller.error(error);
              } finally {
                reader.releaseLock();
                controller.close();
              }
            },
          })
        );
      } else {
        return { message: "Failed to disassemble bytecode" };
      }
    } catch (error) {
      console.error("Axios request failed:", error);
      return { message: "Internal Server Error" };
    }
  } else {
    return `Method ${req.method} Not Allowed`;
  }
}
