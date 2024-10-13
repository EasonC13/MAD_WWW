import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import type { NextRequest, NextResponse } from "next/server";
import { calculateSHA256, decryptWithAES256CBC } from "@/lib/encrypt_utils";
import { VALID_CALL_TYPES_TO_USE_SERVICE_KEY } from "@/constants/VALID_CALL_TYPES";

export const config = {
  runtime: "edge",
};

interface PostBody {
  prompt_messages?: any;
  openai_api_key?: string;
  auth_message?: string;
}

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    let { prompt_messages, openai_api_key, auth_message }: PostBody =
      await req.json();
    if (!auth_message) {
      return { message: "auth_message is required" };
    }

    const decrypted_auth_message = decryptWithAES256CBC(
      auth_message,
      process.env.ENCRYPTION_KEY || "",
      "0000000000000000"
    );
    const { prompt_messages_sha256, timestamp, callType } = JSON.parse(
      decrypted_auth_message
    );
    let prompt_messages_sha256_ = calculateSHA256(
      JSON.stringify(prompt_messages || "")
    );

    if (Date.now() - parseInt(timestamp) > 60 * 1000) {
      return { message: "Request timeout" };
    }
    if (prompt_messages_sha256_ !== prompt_messages_sha256) {
      return { message: "Invalid auth_message" };
    }
    if (VALID_CALL_TYPES_TO_USE_SERVICE_KEY.includes(callType)) {
      openai_api_key = process.env.OPENAI_API_KEY || "";
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
      return "Invalid OpenAI API Key." + error;
    }
    const response = await openai.chat.completions.create({
      model: process.env.CURRENT_MODEL || "chatgpt-4o-latest",
      messages: prompt_messages,
      stream: true,
      temperature: 0.00000000000000001,
      seed: parseInt(process.env.OPENAI_SEED || "123"),
    });
    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } else {
    return `Method ${req.method} Not Allowed`;
  }
}
