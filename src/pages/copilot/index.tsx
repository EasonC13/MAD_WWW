"use client";

import React, { useState } from "react";
import { Spinner } from "flowbite-react";
import { ToastContainer, toast } from "react-toastify";
import Welcome from "@/components/copilot/app/welcome";
import {
  moveLangPrompt,
  supportContractTypes,
} from "../../lib/copilot/constants/bot";
import { BotReturnType } from "@/lib/copilot/types/bot";
import { useRouter } from "next/router";
import GPTUtils from "@/lib/copilot/utils/GPTUtils";

async function getContractType(userInput: string) {
  const prompt = `${moveLangPrompt} You are a professional Move engineer. Your client provides a product description of a Move smart contract: "${userInput}"\nand your task is to determine if the product description matches the following contract categories: [${supportContractTypes.join(
    ","
  )}]. return your reason/through within 5 words first then a strong result (i.e. which category the user input belongs)`;
  const resultRaw = await GPTUtils.stream(prompt, BotReturnType.OneOf);
  const output = GPTUtils.parseResponseToObject(resultRaw);
  return output.result;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onWelcomeSubmit(
    input: string,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();
    setIsLoading(true); // Set loading true when starting the submission
    if (input.length < 15) {
      toast.error("Please enter at least 15 characters.");
      setIsLoading(false); // Stop loading when error is set
    } else {
      const contractType = await getContractType(input);
      if (contractType) {
        router.push({
          pathname: "/copilot/generate",
          query: {
            welcomeInput: input,
            contractType: contractType,
          },
        });
      } else {
        toast.error(
          `Sorry, your current copilot contract type is not supported. Currently supports: [${supportContractTypes.join(
            ", "
          )}]`
        );
      }
      setIsLoading(false); // Stop loading after the async operation
    }
  }

  return (
    <main className="absolute left-0 top-0 flex min-h-screen w-full flex-col items-center bg-black">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <Spinner aria-label="Loading..." size="xl" />
          <p className="ml-5 mt-2 text-white">Verifying input...</p>
        </div>
      )}

      <Welcome onWelcomeSubmit={onWelcomeSubmit} />
      <ToastContainer position="top-center" autoClose={5000} />
    </main>
  );
}
