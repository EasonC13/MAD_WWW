import React, { useState } from "react";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Example JSON data
const linksData = [
  {
    href: "/interview/0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509?module=main&language=gpt4-1106",
    title: "Group O: MoveAiBot old model",
    description: "",
  },
  {
    href: "/interview/0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509?module=main&language=gpt4o",
    title: "Group N: MoveAiBot new model",
    description: "",
  },
  {
    href: "/interview/0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509?module=main&language=source_code",
    title: "Group S:Source Code",
    description: "",
  },
  {
    href: "/interview/0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509?module=main&language=answer&network=mainnet",
    title: "Answer",
    description: "",
  },
  {
    href: "/decompile/0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509?module=main&language=suigpt_decompiled&network=mainnet",
    title: "MoveAiBot Decompiler Page",
    description: "",
  },
  {
    href: "/decompile?api_key=MoveAiBot_interview",
    title: "Freely Try MoveAiBot Decompiler",
    description: "",
  },
];

const LandingPage: React.FC = () => {
  const handleCopy = (link: string) => {
    const fullLink = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullLink);
    toast.success("Link copied!");
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4 mt-5">
        {linksData.map((link, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col justify-between relative"
          >
            <Link href={link.href}>
              <div className="">
                <h2 className="text-2xl font-bold mb-2">{link.title}</h2>
                <p className="mb-4">{link.description}</p>
              </div>
            </Link>
            <button
              onClick={() => handleCopy(link.href)}
              className="absolute bottom-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6.75v-3a.75.75 0 00-.75-.75h-6a.75.75 0 00-.75.75v3M9 12h6m-6 4.5h3M7.5 3.75h9A2.25 2.25 0 0118.75 6v12A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V6A2.25 2.25 0 017.5 3.75z"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default LandingPage;
