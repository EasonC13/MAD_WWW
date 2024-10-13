export function replace_use_modules(
  output_code: string,
  packageReplacementMap: any
) {
  let processed_code = output_code;

  Object.keys(packageReplacementMap).forEach((key) => {
    const value = packageReplacementMap[key];
    processed_code = processed_code.replaceAll(key, value);
  });
  return processed_code;
}
