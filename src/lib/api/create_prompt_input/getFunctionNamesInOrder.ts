import axios from "axios";

export async function getFunctionNamesInOrder(move_base64: string) {
  const disassemble_code_result = await axios.post(
    "https://backend.backup.suigpt.tools/disassemble_move_bytecode",
    {
      bytecode: move_base64,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const disassemble_code = disassemble_code_result.data.disassemble_code;

  const functionNames = extractFunctionNames(disassemble_code);
  return functionNames;
}

export function extractFunctionNames(disassembled_code: string): string[] {
  // Split the disassembled code into lines
  const lines = disassembled_code.split("\n");

  // Array to hold the extracted function names
  const functionNames: string[] = [];

  // Loop through each line and check if it's a function header
  for (const line of lines) {
    if (!line.startsWith("\t") && line.includes("(")) {
      // Extract the function name (before the first '(')
      const functionName = line.split("(")[0].split("<")[0].trim();
      functionNames.push(functionName);
    }
  }

  return functionNames;
}
