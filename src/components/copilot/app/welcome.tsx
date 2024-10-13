"use client";

import React, { useState } from "react";
import Typewriter from "typewriter-effect";

// Icons
import {
  FaArrowRight,
  FaDog,
  FaMoneyBillTrendUp,
  FaPiedPiperHat,
} from "react-icons/fa6";

interface WelcomeProps {
  onWelcomeSubmit: (
    input: string,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
}

const suggestions = [
  {
    icon: <FaDog />,
    text: "Help me create a coin for my dog",
  },
  {
    icon: <FaPiedPiperHat />,
    text: "On the SUI blockchain, create Piper Coin with a fixed supply of 1 million for a Pied Piper fan project from the TV show Silicon Valley.",
  },
  {
    icon: <FaMoneyBillTrendUp />,
    text: "Design a Wall Street Bets token that allows me to create any number of coins on-demand.",
  },
];

const Welcome: React.FC<WelcomeProps> = function Welcome({ onWelcomeSubmit }) {
  const [input, setInput] = useState("");

  function onClickSuggestion(suggestion: string) {
    setInput(suggestion);
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <div className="w-1/2 text-center text-white">
        {/** WELCOME MESSAGE START **/}
        <div
          id="hello_message"
          className="mb-4 w-full text-3xl flex items-center justify-center gap-5"
        >
          <div className="w-20 h-20 overflow-hidden mb-5">
            <img
              src="./images/suigpt-head.png"
              className="rounded-full shadow-lg w-20 h-20 m-auto"
            />
          </div>
          <Typewriter
            options={{
              delay: 50,
            }}
            onInit={(typewriter) => {
              typewriter
                .typeString("Hi! I am your handy Sui Copilot")
                .pauseFor(Infinity)
                .start();
            }}
          />
        </div>
        {/** WELCOME MESSAGE END **/}

        {/** CHAT START **/}
        <form className="flex items-center rounded-lg border-2 border-[#3D3F40] bg-[#202222] p-4">
          <textarea
            className="text-md mr-4 w-full resize-none border-none bg-[#202222] p-2 outline-none focus:border-0 focus:ring-0"
            placeholder="What would you like to build today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-full bg-[#3D3F40] p-2 text-2xl text-white hover:bg-gray-600"
            onClick={(e) => onWelcomeSubmit(input, e)}
          >
            <FaArrowRight />
          </button>
        </form>
        {/** CHAT END **/}

        {/** SUGGESTIONS START **/}
        <div className="mt-5 flex w-full flex-row items-stretch gap-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => onClickSuggestion(suggestion.text)}
              className="w-auto flex-1 cursor-pointer rounded-lg border-2 border-[#3D3F40] bg-[#202222] px-5 py-6"
            >
              <div className="flex w-full flex-col">
                <p className="w-full text-2xl">{suggestion.icon}</p>
                <p className="text-md ml-0 mt-2 w-full text-left">
                  {suggestion.text}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/** SUGGESTIONS START **/}
      </div>
    </main>
  );
};

export default Welcome;
