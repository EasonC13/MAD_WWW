export const logDecompileProcess = async (
  packageId: string,
  moduleName: string,
  bytecode: string,
  status: string,
  allText = ""
) => {
  try {
    await fetch("/api/move/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        package_id: packageId,
        module_name: moduleName,
        bytecode: bytecode,
        status: status, // "start" or "complete"
        decompiled_text: allText, // Only for "complete" status
      }),
    });
  } catch (error) {
    console.error("Error logging decompile process:", error);
  }
};
