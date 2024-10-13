export function extractUseStatementsAndPackageMap(
  totalDecompiledText: string
): {
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
