export function count_function_amount(decompiled_code: any) {
  const decompiled_code_rows = decompiled_code.split("\n");
  let function_count = 0;

  for (let i = 0; i < decompiled_code_rows.length; i++) {
    if (
      decompiled_code_rows[i].includes(" fun ") &&
      decompiled_code_rows[i].includes("(") &&
      decompiled_code_rows[i].includes(")") &&
      decompiled_code_rows[i].includes("{") &&
      !decompiled_code_rows[i].includes("        ")
    )
      function_count += 1;
  }
  return function_count;
}
