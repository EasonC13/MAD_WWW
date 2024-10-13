import React from "react";
import Typewriter from "typewriter-effect";
import Link from "next/link";
import { FaTimes } from "react-icons/fa";

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-center mb-10 mt-5">
        <div className="font-bold text-4xl flex text-center justify-center items-center">
          <span className="mr-3">Move AI</span>
          <Typewriter
            options={{
              strings: ["Tools", "Decompiler", "Copilot"],
              autoStart: true,
              loop: true,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
        <Link
          href="/decompile"
          className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col justify-between"
        >
          <div className="mb-4">
            {/* <img
              src="/images/MoveAiBot_Intro.png"
              alt="Decompiler"
              className="w-full h-32 object-cover rounded-lg"
            /> */}
          </div>
          <div className="">
            <h2 className="text-2xl font-bold mb-2">Decompiler</h2>
            <p className="mb-4">
              Decompile Sui Move code back to easy-to-read and compile-ready
              source code
            </p>
          </div>
        </Link>

        {/* <Link
          href="/copilot"
          className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col justify-between"
        >
          <div className="mb-4">
            <img
              src="/images/suigpt-copilot.png"
              alt="Copilot"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
          <div className="">
            <h2 className="text-2xl font-bold mb-2">Copilot</h2>
            <p className="mb-4">
              Let Move AI Copilot generate Sui Move smart contract code for you
              based on your instructions.
            </p>
          </div>
        </Link>
        <Link
          href="/gas"
          className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col justify-between"
        >
          <div className="mb-4">
            <div className="flex justify-center items-end mb-3">
              <div className="flex">
                <img
                  // src="/images/suigpt_logo.png"
                  src="/images/suigpt-head.png"
                  className="w-auto h-[80px]"
                />
                <FaTimes size={24} className="self-end" />
                <img src="/images/Sui_Gas.png" className="w-auto h-[80px]" />
              </div>
            </div>
          </div>
          <div className="">
            <h2 className="text-2xl font-bold mb-2">Gas Viewer</h2>
            <p className="mb-4">
              Use Move AI Gas Viewer and other incoming Move AI Developer Tool
              kits to enhance Sui Move development experience.
            </p>
          </div>
        </Link> */}
      </div>
    </div>
  );
};

export default LandingPage;
