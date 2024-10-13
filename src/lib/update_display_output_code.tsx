import React from "react";
import { ModulesMap } from "@/lib/types";

export function update_display_output_code(
  resultDict: { [key: string]: string },
  chunkStarts: { [key: string]: string },
  resultDictKeys: string[],
  decompiled_code_prefix: string,
  decompiled_code_postfix: string,
  modules: ModulesMap,
  selectedModule: string,
  setModules: React.Dispatch<React.SetStateAction<ModulesMap>>,
  display_field: string = "suigpt_decompiled"
) {
  let function_codes = "";

  const sections = ["functions"];

  for (const section of sections) {
    if (
      resultDictKeys.filter((key) => key.split(":")[0] === section).length === 0
    ) {
      continue;
    }
    if (section != "functions") {
      function_codes += `    // ----- ${
        section.charAt(0).toUpperCase() + section.slice(1)
      } Functions -----\n\n`;
    } else {
      function_codes += `\n    // ----- Functions -----\n\n`;
    }
    for (const index of resultDictKeys) {
      if (index.split(":")[0] === section) {
        let code = "";
        if (resultDict[index].length < 2) {
          code = "    " + chunkStarts[index];
        } else {
          code = resultDict[index];
        }

        if (code[0] == "\n") {
          code = code.substring(1);
        }

        if (code.endsWith("\n")) {
          code += "\n";
        } else {
          code += "\n\n";
        }
        try {
          function_codes += code;
          ("\n");
        } catch (e) {}
      }
    }
  }

  let total_code =
    decompiled_code_prefix +
    function_codes.substring(0, function_codes.length - 2) +
    decompiled_code_postfix;

  modules[selectedModule][display_field] = total_code;
  setModules({ ...modules });
}
