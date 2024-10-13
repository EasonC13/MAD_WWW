export function processDecompiledCodeToBlocks(
  decompiledCode: string
): [string, Map<string, string[]>] {
  // Remove Comments
  decompiledCode = decompiledCode.replace(
    "\n    \n    // decompiled from Move bytecode v6\n}\n\n",
    "\n}\n"
  );

  // Detect Mutation and Access Error
  {
    const newCodeLines: string[] = [];
    const decompiledCodeLines: string[] = decompiledCode.split("\n");
    decompiledCodeLines.forEach((codeLine) => {
      try {
        let warning = false;
        let mutatedVariables: string[] = [];
        if (codeLine.includes("&mut ") && codeLine.includes("        ")) {
          const muts = codeLine.split("&mut ").slice(1);
          muts.forEach((mut) => {
            const variable = mut.split(",")[0].split(")")[0];
            mutatedVariables.push(variable);
          });

          mutatedVariables.forEach((mutatedVariable) => {
            if (
              (codeLine.match(new RegExp(mutatedVariable, "g")) || []).length >
              1
            ) {
              warning = true;
            }
          });
        }
        if (warning) {
          const indent = codeLine.length - codeLine.trimStart().length;
          newCodeLines.push(
            `${" ".repeat(
              indent
            )}// below is incorrect because it mutate the variable ${mutatedVariables.join(
              ", "
            )} while access it at the same time (within the range of same semicolon). Please fix it by assigning variables to each parameter expect the mut one, instad of put it all in one function call parameters. Remember to still keep other syntax and format as original.`
          );
        }
      } catch (e) {
      } finally {
        newCodeLines.push(codeLine);
      }
    });

    decompiledCode = newCodeLines.join("\n");
  }

  {
    let hasIllegalAsStatement = (code: string) => {
      const codeParts = code.split(" as ");
      for (let i = 0; i < codeParts.length; i++) {
        if (!codeParts[i].includes(")") && !codeParts[i].includes("(")) {
          return true;
        }
      }
      return false;
    };
    const newCodeLines: string[] = [];
    const decompiledCodeLines = decompiledCode.split("\n");
    decompiledCodeLines.forEach((codeLine) => {
      if (codeLine.includes(" as ") && hasIllegalAsStatement(codeLine)) {
        newCodeLines.push(
          `// below is incorrect because it use "as" statement without wrapping it with brackets (). Fix it by add wrapping () to all "as" statements, you should not left any "as" outside brackets () around , or ; . For example, change \`\`\`let a_u64 = a as u64;\`\`\` to \`\`\`let a_u64 = (a as u64);\`\`\``
        );
      }
      newCodeLines.push(codeLine);
    });
    decompiledCode = newCodeLines.join("\n");
  }

  const dataReplacementMap: { [key: string]: string } = {};
  const decompiledCodeLines: string[] = decompiledCode.split("\n");

  // Re-order
  const blocks: string[] = [];
  let isInBlock = false;
  decompiledCode.split("\n").forEach((line) => {
    if (line.length < 5) return;
    if (line.startsWith("    ") && line[4] !== " ") {
      if (isInBlock) {
        isInBlock = false;
        blocks[blocks.length - 1] += line;
      } else {
        isInBlock = true;
        blocks.push("");
      }
    }
    if (isInBlock) {
      blocks[blocks.length - 1] += line + "\n";
    }
  });

  const blocksWithCategories: Map<string, string[]> = new Map([
    ["struct", []],
    ["functions", []],
  ]);

  blocks.forEach((block) => {
    if (block.startsWith("    struct ")) {
      blocksWithCategories.get("struct")?.push(block);
    } else if (
      block.startsWith("    fun ") ||
      block.startsWith("    public ") ||
      block.startsWith("    public(friend) ")
    ) {
      blocksWithCategories.get("functions")?.push(block);
    }
  });

  const orders = ["struct", "functions"];
  let orderedBlocks: string[] = [];
  orders.forEach((order) => {
    const blocks = blocksWithCategories.get(order);
    if (blocks) {
      blocks.sort();
      orderedBlocks = orderedBlocks.concat(blocks);
    }
  });

  decompiledCode =
    decompiledCode.split("\n")[0] +
    "\n" +
    orderedBlocks.join("\n\n") +
    "\n" +
    "}";

  return [decompiledCode, blocksWithCategories];
}
