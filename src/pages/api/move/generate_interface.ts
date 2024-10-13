import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { encryptWithAES256CBC } from "../../../lib/encrypt_utils";

interface PostBody {
  move_base64?: string;
}

type Data = {
  message: string;
  decompiled_by_algorithm: any;
  useStatements: any;
  packageReplacementMap: any;
  interfaceUseStatements: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | any>
) {
  if (req.method === "POST") {
    const { move_base64 }: PostBody = req.body;

    if (!move_base64) {
      res.status(400).json({ message: "move_base64 is required" });
      return;
    }

    try {
      const response = await axios.post(
        "https://backend.backup.suigpt.tools/decompile_move_bytecode",
        {
          bytecode: move_base64,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { data } = response;
      if (!data) {
        res.status(500).json({ message: "Failed to disassemble bytecode" });
      }

      const [decompiled_code, blocksWithCategories] =
        processDecompiledCodeToBlocks(data.decompiled_code);

      const encryptedBlockWithCategories: Map<string, string[]> = new Map();
      blocksWithCategories.forEach((value: string[], key: string) => {
        encryptedBlockWithCategories.set(
          key,
          value.map((block) => {
            return encryptWithAES256CBC(
              block,
              process.env.ENCRYPTION_KEY || "",
              "0000000000000000"
            );
          })
        );
      });
      const decompiled_by_algorithm = {
        first_line: decompiled_code.split("\n")[0],
        struct: blocksWithCategories.get("struct"),
      };

      let getHeader = (block: string) => {
        return block.trimStart().split("(")[0].split("<")[0];
      };

      let getInterface = (block: string) => {
        let f = block.trimStart().split("\n")[0];
        return `${f}\n        abort 0\n    }`;
      };

      const contract_interface = {
        // use functions instead of public here.
        functions: blocksWithCategories.get("public")?.map(getInterface),
      };

      const contract_header_that_need_further_processing = {
        // use functions instead of public here.
        functions: blocksWithCategories.get("public")?.map(getHeader),
      };

      const { useStatements, packageReplacementMap } =
        extractUseStatementsAndPackageMap(decompiled_code);

      const interfaceUseStatements: string[] = [];

      useStatements.forEach((useStatement) => {
        const moduleName = useStatement.split("::")[1].split(";")[0];
        // Check if the module is used in decompiled_by_algorithm and contract_interface
        const isUsedInDecompiledAlgorithm = JSON.stringify(
          decompiled_by_algorithm
        ).includes(`${moduleName}::`);
        const isUsedInInterface = JSON.stringify(contract_interface).includes(
          `${moduleName}::`
        );
        if (isUsedInDecompiledAlgorithm || isUsedInInterface) {
          interfaceUseStatements.push(useStatement);
        }
      });

      // then we can decrypt it
      // const decryptedBlockWithCategories: Map<string, string[]> = new Map();
      // encryptedBlockWithCategories.forEach((value: string[], key: string) => {
      //   decryptedBlockWithCategories.set(
      //     key,
      //     value.map((block) => {
      //       const decipher = crypto.createDecipheriv(
      //         "aes-256-cbc",
      //         Buffer.from(process.env.ENCRYPTION_KEY || ""),
      //         Buffer.from("0000000000000000")
      //       );
      //       let decrypted = decipher.update(Buffer.from(block, "hex"));
      //       decrypted = Buffer.concat([decrypted, decipher.final()]);
      //       return decrypted.toString();
      //     })
      //   );
      // });
      res.status(200).json({
        message: "Interface Creation successful",
        decompiled_by_algorithm,
        contract_interface,
        contract_header_that_need_further_processing,
        packageReplacementMap,
        interfaceUseStatements,
      });
    } catch (error) {
      console.error("Axios request failed:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function processDecompiledCodeToBlocks(
  decompiledCode: string
): [string, Map<string, string[]>] {
  // Remove Comments
  decompiledCode = decompiledCode.replace(
    "\n    \n    // decompiled from Move bytecode v6\n}\n\n",
    "\n}\n"
  );

  // Detect Mutation and Access Error
  let newCodeLines: string[] = [];
  const decompiledCodeLines: string[] = decompiledCode.split("\n");
  decompiledCodeLines.forEach((codeLine) => {
    let warning = false;
    let mutatedVariables: string[] = [];
    if (codeLine.includes("&mut ")) {
      const pattern = /mut (\w+)[,)]/g;
      const muts = codeLine.match(pattern);
      if (muts) {
        muts.forEach((mut) => {
          mutatedVariables.push(mut.split(",")[0].split(")")[0]);
        });
        mutatedVariables.forEach((mutatedVariable) => {
          if (codeLine.split(mutatedVariable).length - 1 > 1) {
            warning = true;
          }
        });
      }
    }
    if (warning) {
      const indent = codeLine.length - codeLine.trimStart().length;
      newCodeLines.push(
        `${" ".repeat(
          indent
        )}// below is incorrect because it mutate the variable ${mutatedVariables.join(
          ", "
        )} while access it at the same time (within the range of same semicolon). Please fix it by assigning variables.`
      );
    }
    newCodeLines.push(codeLine);
  });

  decompiledCode = newCodeLines.join("\n");

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
    ["init", []],
    ["internal", []],
    ["public", []],
  ]);

  blocks.forEach((block) => {
    if (block.startsWith("    struct ")) {
      blocksWithCategories.get("struct")?.push(block);
    } else if (block.startsWith("    fun init")) {
      blocksWithCategories.get("init")?.push(block);
    } else if (
      block.startsWith("    public ") ||
      block.startsWith("    public(friend)")
    ) {
      blocksWithCategories.get("public")?.push(block);
    } else if (block.startsWith("    fun ")) {
      blocksWithCategories.get("internal")?.push(block);
    }
  });

  const orders = ["struct", "init", "internal", "public"];
  let orderedBlocks: string[] = [];
  orders.forEach((order) => {
    const blocks = blocksWithCategories.get(order);
    if (blocks) {
      blocks.sort();
      orderedBlocks = orderedBlocks.concat(blocks);
    }
  });

  decompiledCode =
    decompiledCodeLines[0] + "\n" + orderedBlocks.join("\n\n") + "\n" + "}";

  return [decompiledCode, blocksWithCategories];
}

function extractUseStatementsAndPackageMap(totalDecompiledText: string): {
  useStatements: string[];
  packageReplacementMap: Record<string, string>;
} {
  totalDecompiledText = totalDecompiledText
    .replaceAll(
      "0000000000000000000000000000000000000000000000000000000000000002",
      "0x2"
    )
    .replaceAll(
      "0000000000000000000000000000000000000000000000000000000000000001",
      "0x1"
    );
  // Regular expression to match package patterns
  const pattern = /\b\w+::\w+::\w+/g;
  const matches = totalDecompiledText.match(pattern) || [];
  const packages = new Set<string>();

  matches.forEach((match) => {
    const parts = match.split("::");
    packages.add(parts.slice(0, 2).join("::"));
  });

  const useStatements: string[] = [];
  const alias: Record<string, string> = {
    "0x1": "std",
    "0x2": "sui",
    "0000000000000000000000000000000000000000000000000000000000000002": "sui",
  };
  const duplicates: Record<string, number> = {};
  const packageReplacementMap: Record<string, string> = {};

  packages.forEach((packageNameWithSource) => {
    const [source, packageName] = packageNameWithSource.split("::");
    const normalizedSource = alias[source] || source;

    const packageKey = `${normalizedSource}::${packageName}`;
    const packageCount = duplicates[packageName] || 0;

    if (packageCount > 0) {
      packageReplacementMap[packageKey] = `${packageName}_${packageCount}`;
      useStatements.push(
        `    use ${normalizedSource}::${packageName} as ${packageName}_${packageCount};`
      );
    } else {
      packageReplacementMap[packageNameWithSource] = packageName;
      useStatements.push(`    use ${normalizedSource}::${packageName};`);
    }

    duplicates[packageName] = packageCount + 1;
  });

  return { useStatements, packageReplacementMap };
}
