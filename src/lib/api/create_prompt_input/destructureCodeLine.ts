let funArgIndex = 0;
export function destructureCodeLine(codeLine: string): string {
  if (
    codeLine.includes("(") &&
    ![" if ", " else ", " while ", " loop ", " : ", "!assert"].some((cond) =>
      codeLine.includes(cond)
    )
  ) {
    const paddings = codeLine.split(codeLine.trim())[0];

    const extractArguments = (argsStr: string): string[] => {
      const processedArgs: string[] = [];
      let openBraceCount = 0;
      let openAngleCount = 0;
      let startIdx = 0;

      argsStr.split("").forEach((char, i) => {
        if (char === "(") openBraceCount++;
        else if (char === ")") openBraceCount--;
        else if (char === "<") openAngleCount++;
        else if (char === ">") openAngleCount--;
        else if (char === "," && openBraceCount === 0 && openAngleCount === 0) {
          processedArgs.push(argsStr.slice(startIdx, i).trim());
          startIdx = i + 1;
        }
      });

      if (startIdx < argsStr.length) {
        processedArgs.push(argsStr.slice(startIdx).trim());
      }
      return processedArgs;
    };

    const splitFunctionAndArgs = (code: string): [string, string[]] => {
      const lastParenIdx = code.lastIndexOf(")");
      const firstParenIdx = code.indexOf("(");
      const functionName = code.slice(0, firstParenIdx).trim();
      const argsStr = code.slice(firstParenIdx + 1, lastParenIdx);
      return [functionName, extractArguments(argsStr)];
    };

    const [functionName, args] = splitFunctionAndArgs(codeLine);

    const outputCodeLines: string[] = [];
    const argReplacements = new Map<string, string>();

    args.forEach((arg) => {
      const argName = `fun_arg${funArgIndex++}`;
      outputCodeLines.push(`${paddings}const ${argName} = ${arg};`);
      argReplacements.set(arg, argName);
    });

    const reconstructedArgs = args
      .map((arg) => argReplacements.get(arg) || arg)
      .join(", ");
    outputCodeLines.push(
      `${paddings}const v0 = ${functionName}(${reconstructedArgs});`
    );

    return outputCodeLines.join("\n");
  }
  return codeLine;
}
