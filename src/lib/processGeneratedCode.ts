export function processGeneratedCode(code: string) {
  let newRows = [];
  const codeLines = code.split("\n");

  for (let row of codeLines) {
    if (row.includes("use 0x2::0x2;")) {
      continue;
    }
    if (row.includes(" use ")) {
      row = row.replace("0x1::", "std::").replace("0x2::", "sui::");
      if (!row.includes("::")) {
        row = row.replace(" use ", " use sui::");
      }
    } else {
      row = row.replace("0x1::", "").replace("0x2::", "");
    }
    newRows.push(row);
  }

  let processedCode = newRows.join("\n");
  processedCode = processedCode.replace(/ let mut /g, " let ");
  processedCode = processedCode.replace(/::\{self/g, "::{Self");
  processedCode = processedCode.replace("```move\n", "").replace("```", "");

  return processedCode;
}
