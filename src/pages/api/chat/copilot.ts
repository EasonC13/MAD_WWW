import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import type { NextRequest, NextResponse } from "next/server";
import { calculateSHA256, decryptWithAES256CBC } from "@/lib/encrypt_utils";
import { VALID_CALL_TYPES_TO_USE_SERVICE_KEY } from "@/constants/VALID_CALL_TYPES";
import { CORS_HEADERS } from "@/lib/utils/cors";

export const config = {
  runtime: "edge",
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: ["system", "user", "assistant"]
 *           description: The role of the message sender.
 *         content:
 *           type: string
 *           description: The content of the message.
 *       required:
 *         - role
 *         - content
 *     SuiCopilotQueryModel:
 *       type: object
 *       properties:
 *         openai_api_key:
 *           type: string
 *           description: The API key for OpenAI.
 *           example: "sk-1234567890"
 *         query:
 *           type: string
 *           description: The query for the copilot.
 *           example: "A fungible coin name and symbol is Eason that I can manage to airdrop by a list of whitelists"
 *         previous_messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *           description: Previous messages exchanged.
 *           example: [
 *             {
 *               "role": "system",
 *               "content": "TBA"
 *             },
 *             {
 *               "role": "system",
 *               "content": "This is the code you have so far: module Eason {\n\n}"
 *             },
 *             {
 *               "role": "user",
 *               "content": "Instruction: A fungible coin name and symbol is Eason that I can manage to airdrop by a list of whitelists"
 *             },
 *             {
 *               "role": "assistant",
 *               "content": "module Eason {\n\n}"
 *             }
 *           ]
 *         previous_output:
 *           type: string
 *           description: The previous output from the assistant.
 *           example: "module Eason {\n\n}"
 *         current_code:
 *           type: string
 *           description: The current code being worked on.
 *           example: "module Eason {\n\n}"
 *       required:
 *         - openai_api_key
 *         - query
 *         - previous_messages
 *         - previous_output
 *         - current_code
 */

/**
 * @swagger
 * /api/chat/copilot:
 *   post:
 *     summary: Handles chat requests for Sui Copilot.
 *     description: This endpoint handles chat requests for Sui Copilot by interfacing with the OpenAI API and a backend service to generate responses.
 *     tags:
 *       - copilot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuiCopilotQueryModel'
 *     responses:
 *       200:
 *         description: The response from the OpenAI API.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid request.
 *       405:
 *         description: Method not allowed.
 *       500:
 *         description: Internal server error.
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SuiCopilotQueryModel {
  openai_api_key: string;
  query: string;
  previous_messages: Message[];
  previous_output: string;
  current_code: string;
}

export default async function handler(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }
  if (req.method === "POST") {
    const {
      query,
      previous_messages,
      previous_output,
      current_code,
      openai_api_key,
    }: SuiCopilotQueryModel = await req.json();

    let filtered_messages = previous_messages;
    if (previous_messages[0].role === "system") {
      filtered_messages = previous_messages.slice(1);
    }

    const previous_outputs: Message[] = [];
    if (previous_output !== "" && filtered_messages[-1].role !== "assistant") {
      previous_outputs.push({ role: "assistant", content: previous_output });
    }

    const openai = new OpenAI({
      apiKey: openai_api_key,
    });

    const result = await fetch(
      "https://backend.backup.suigpt.tools/api/get_prompt_by_query_for_sui_copilot",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          previous_messages: filtered_messages,
          previous_output: previous_output,
          current_code: current_code,
        }),
      }
    );
    const prompt_messages = await result.json();
    console.log({ prompt_messages });

    const response = await openai.chat.completions.create({
      model: process.env.CURRENT_MODEL || "chatgpt-4o-latest",
      messages: prompt_messages,
      stream: true,
      temperature: 0,
    });
    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } else {
    return `Method ${req.method} Not Allowed`;
  }
}
