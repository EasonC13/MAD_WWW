// src/components/decompile/LanguageSelector.tsx
import React from "react";

export function LanguageSelector({
  handleSelectLanguage,
  codeLanguage,
  package_id,
}: {
  handleSelectLanguage: any;
  codeLanguage: string;
  package_id: string;
}) {
  let tabs = [
    "move_bytecode",
    "move_disassembled",
    "revela",
    "interface",
    "suigpt_decompiled",
  ];
  if (
    package_id ==
    "0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509"
  ) {
    tabs.push("source_code");
    tabs = tabs.filter(
      (language) =>
        language !== "interface" &&
        language !== "move_bytecode" &&
        language !== "move_disassembled"
    );
  }
  return (
    <div className="flex justify-center gap-2 mb-4 w-full">
      {tabs.map((language) => (
        <button
          key={language}
          id={language}
          onClick={() => handleSelectLanguage(language)}
          className={`flex-1 ${
            codeLanguage === language ? "bg-blue-500" : "bg-gray-700"
          } hover:bg-blue-700 text-white font-bold py-2 px-1 rounded-lg`}
        >
          {language === "move_bytecode"
            ? "Bytecode"
            : language === "move_disassembled"
            ? "Disassembled"
            : language === "interface"
            ? "Interface"
            : language === "suigpt_decompiled"
            ? "Decompiled by Move AI"
            : language === "source_code"
            ? "Source Code"
            : "Revela"}
        </button>
      ))}
    </div>
  );
}
