import {
  BotHistory,
  BotReturnType,
} from "@/lib/copilot/types/bot";
import { prompts } from "@/lib/copilot/types/prompts";
import axios from "axios";

export default {
  _cache: Object.create({}),

  /**
   * Get the history of the conversation in GPT format
   * @param history BotHistory[]
   * @param systemPrompt string | null
   * @returns void
   */
  getHistory(history: BotHistory[], systemPrompt: string | null = null) {
    // Place system prompt on top of the history
    if (systemPrompt != null) {
      history.push({ role: "system", content: systemPrompt });
    }

    // Assemble the history
    const historyLength = history.length;
    for (let i = 0; i < historyLength; i++) {
      history.push({
        role: history[i].role,
        content: history[i].content,
      });
    }
    return history;
  },

  /**
   * Get the return prompt for the bot
   * @param returnType string
   * @returns
   */
  getReturnPrompt(returnType: string): string {
    if (returnType === BotReturnType.Raw) {
      return "";
    }

    // Cache the return prompt
    if (!this._cache[returnType]) {
      const typePrompt = prompts[returnType];
      const codeBlock = "```";
      this._cache[
        returnType
      ] = `Respond strictly with JSON. The JSON should be compatible with the TypeScript type from the following:
                ${codeBlock}typescript
                ${typePrompt}
                ${codeBlock}`;
    }

    return this._cache[returnType];
  },

  async stream(prompt: string, returnType: string, onData: Function | null = null, onComplete: Function | null = null): Promise<string> {
    prompt = `${prompt}\n${this.getReturnPrompt(returnType)}`;
    let prompt_messages = this.getHistory([{ role: "user", content: prompt }]);
    let result = '';

    try {
      // Get the auth message
      const auth_response = await axios.post("/api/chat/chat_auth", {
        prompt_messages,
        openai_api_key: "sui_copilot", // TODO: this is a hack, should remove after hackthon
        digest: null,
        user: null,
      });
      const { auth_message } = auth_response.data;

      // Stream from GPT
      const response = await fetch("/api/chat/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_messages,
          auth_message,
          openai_api_key: null,
          digest: null,
          userAddress: null,
        }),
      });

      if (!response.body) {
        throw new Error("Failed to get readable stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          if (text) {
            try {
              result += text;
              if (onData) {
                  onData(text, result);
              }
            } catch (error) {
                console.error("Error parsing JSON data:", error);
            }
        }
      }

      if (onComplete) {
          onComplete(result);
      }
    } catch (error) {
      console.error('Error making request or processing data:', error);
    }

    return result;
  },

  /**
   * Parse the response from GPT
   * @param returnType string
   * @param response string
   * @returns
   */
  parseCodeResponse(response: string | undefined): any {
    if (!response) {
        return response;
    }
    const parts = response.split(/```.*\n/);
    if (parts.length < 2) {
      return response
    }
    let rawJson = parts[1].split("```")[0].trim();
    return rawJson
  },

  parseResponseToObject(response: string): any {
    const data = this.parseCodeResponse(response);
    return JSON.parse(data);
  }
};
