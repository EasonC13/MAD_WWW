import axios from "axios";
import { Message } from "./community/Chatroom";

export function handleChatroomSendMessage(
  setMessages: any,
  messages: Message[],
  lastMessageRef: any,
  setBotSending: any,
  setMessage: any,
  highlightedText: string,
  fullText: string,
  selectedText: string
) {
  return (
    text: string,
    digest: string,
    apiKey: string,
    userAddress: string
  ) => {
    const userMessage: Message = {
      text,
      id: Date.now(),
      sender: "user",
    };
    let previousPromptMessages: any = [];
    messages.map((message) => {
      previousPromptMessages.push({
        role: message.sender,
        content: message.text,
      });
    });
    setMessages([...messages, userMessage]);
    lastMessageRef?.current?.scrollIntoView({ behavior: "instant" });
    setBotSending(true);
    setMessage("");
    setTimeout(async () => {
      let prompt_messages;
      if (text === "Explain Highlighted Code") {
        text = highlightedText;
        prompt_messages = [
          {
            role: "system",
            content:
              "Move is an open source language for writing safe smart contracts. It's format is similar to Rust. You are a Senior Move Developer. \n I will provide some Move code, and it will be your job to answer users' question about the code.",
          },
          {
            role: "system",
            content:
              "The full context of the code is in the following triple backquote (```) \n```\n${codeContext}\n```\n. The Move code user selected is in the following triple backquote (```) \n```\n${selectedCode}\n```\n. The Please focus on explain target Move code. Output in Markdown format."
                .replace("${codeContext}", fullText)
                .replace("${selectedCode}", text),
          },
          ...previousPromptMessages,
          {
            role: "user",
            content: `Can you explain the highlighted code for me?`,
          },
        ];
      } else if (text === "Explain Selected Code") {
        text = selectedText;
        prompt_messages = [
          {
            role: "system",
            content:
              "Move is an open source language for writing safe smart contracts. It's format is similar to Rust. You are a Senior Move Developer. \n I will provide some Move code, and it will be your job to answer users' question about the code.",
          },
          {
            role: "system",
            content:
              "The full context of the code is in the following triple backquote (```) \n```\n${codeContext}\n```\n. The Move code user selected is in the following triple backquote (```) \n```\n${selectedCode}\n```\n. The Please focus on explain target Move code. Output in Markdown format."
                .replace("${codeContext}", fullText)
                .replace("${selectedCode}", text),
          },
          ...previousPromptMessages,
          {
            role: "user",
            content: `Can you explain the selected code for me?`,
          },
        ];
      } else {
        prompt_messages = [
          {
            role: "system",
            content:
              "Move is an open source language for writing safe smart contracts. It's format is similar to Rust. You are a Senior Move Developer. \n I will provide some Move code, and it will be your job to answer users' question about the code.",
          },
          {
            role: "system",
            content:
              `The full context of the code is in the following triple backquote (\`\`\`) \n\`\`\`\n${fullText}\n\`\`\`\n` +
              (selectedText
                ? `The Move code user selected is in the following triple backquote (\`\`\`) \n\`\`\`\n${selectedText}\n\`\`\`\n`
                : "") +
              (highlightedText
                ? `The Move code user highlighted is in the following triple backquote (\`\`\`) \n\`\`\`\n${highlightedText}\n\`\`\`\n`
                : "") +
              "Please focus on answer user's question. Output in Markdown format.",
          },
          ...previousPromptMessages,
          {
            role: "user",
            content: `Question: ${text}`,
          },
        ];
      }

      let output_text = "";
      // if (!apiKey) {
      //   output_text = "Please set up a valid OpenAI API Key";
      // }
      const auth_response = await axios.post("/api/chat/chat_auth", {
        prompt_messages,
        openai_api_key: apiKey,
        digest,
        signature: "",
        user: userAddress,
      });
      // get the auth_message
      const { auth_message } = auth_response.data;
      const response = await fetch("/api/chat/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_messages,
          auth_message,
          openai_api_key: apiKey,
          digest,
          userAddress,
        }),
      });
      console.log(response);
      if (!response.ok) {
        // throw new Error(response.statusText);
        output_text = `Error: ${response.statusText}.\n\nYou may need to set up a valid OpenAI API Key.`;
      } else {
        const data = response.body;
        if (!data) {
          return;
        }
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let token = 0;
        while (!done) {
          token += 1;
          const data = await reader.read();
          const { value, done: doneReading } = data;
          done = doneReading;
          const textChunk = decoder.decode(value);

          output_text += textChunk;
          const botMessage: Message = {
            text: output_text,
            id: Date.now() + 1,
            sender: "assistant",
          };
          setMessages([...messages, userMessage, botMessage]);
        }
      }
      const botMessage: Message = {
        text: output_text,
        id: Date.now() + 1,
        sender: "assistant",
      };
      setMessages([...messages, userMessage, botMessage]);
      setBotSending(false);
    }, 500);
  };
}
