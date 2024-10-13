def destructure_code_line(code_line):
    try:
        if (
            "(" not in code_line
            or " if " in code_line
            or " else " in code_line
            or " while " in code_line
            or " loop " in code_line
            or " : " in code_line
            or "!assert" in code_line
        ):
            return code_line
        paddings = code_line.split(code_line.lstrip())[0]

        def extract_arguments(args_str):
            # Initialize the list to hold processed arguments
            processed_args = []
            # Variables to track the number of open parentheses and brackets
            open_brace_count = 0
            open_angle_count = 0
            # Variable to track the start of an argument
            start_index = 0

            # Iterate through each character in the argument string
            for i, char in enumerate(args_str):
                # Handle opening and closing of parentheses
                if char == "(":
                    open_brace_count += 1
                elif char == ")":
                    open_brace_count -= 1

                # Handle opening and closing of angle brackets
                if char == "<":
                    open_angle_count += 1
                elif char == ">":
                    open_angle_count -= 1

                # Determine if a comma is a separator for top-level arguments
                if char == "," and open_brace_count == 0 and open_angle_count == 0:
                    processed_args.append(args_str[start_index:i].strip())
                    start_index = i + 1

            # Add the last argument if there's any remaining after the final comma
            if start_index < len(args_str):
                processed_args.append(args_str[start_index:].strip())

            return processed_args

        def extract_context_calls(original_code):
            brackets_splits = original_code.split("(")
            space_split = brackets_splits[0].split(" ")
            index = -1
            num_of_open_brackets = 0
            while index >= -len(space_split):
                num_of_open_brackets += space_split[index].count(">")
                num_of_open_brackets -= space_split[index].count("<")
                if num_of_open_brackets == 0:
                    break
                index -= 1
            code_before_function = " ".join(space_split[:index])
            if code_before_function:
                code_before_function += " "
            code_after_function = original_code.split(")")[-1]
            function = " ".join(space_split[index:])
            args_str = ("(".join(brackets_splits[1:])).replace(
                f"){code_after_function}", ""
            )
            processed_args = extract_arguments(args_str)
            return function, processed_args, code_before_function, code_after_function

        function_data_dict = {}
        keys = []
        arg_replacement_dict = {}

        def process_extraction(
            original_code, function_data_dict, keys, is_parent=False
        ):
            function, processed_args, code_before_function, code_after_function = (
                extract_context_calls(original_code)
            )
            # print(f"""
            #       function: {function}
            #       processed_args: {processed_args}
            #       code_before_function: {code_before_function}
            #       code_after_function: {code_after_function}
            #       """)
            key = f"{function}({', '.join(processed_args)})"
            function_data_dict[key] = {
                "function": function,
                "original_code": original_code,
                "args": processed_args,
                "code_before_function": code_before_function,
                "code_after_function": code_after_function,
                "is_parent": is_parent,
            }
            keys.append(key)
            for arg in function_data_dict[keys[-1]]["args"]:
                if "(" in arg:
                    process_extraction(arg, function_data_dict, keys)

        process_extraction(code_line, function_data_dict, keys, is_parent=True)
        fun_arg_index = 0
        output_code_lines = []
        defined_args = []
        for key in keys[::-1]:
            for arg in function_data_dict[key]["args"]:
                if f"fun_arg{fun_arg_index}" in defined_args:
                    continue
                try:
                    (
                        function,
                        processed_args,
                        code_before_function,
                        code_after_function,
                    ) = extract_context_calls(arg)
                    key_ = f"{function}({', '.join(processed_args)})"
                    if key_ in function_data_dict:
                        continue
                except:
                    pass
                defined_args.append(arg)
                output_code_lines.append(
                    f"{paddings}let fun_arg{fun_arg_index} = {arg};"
                )

                fun_arg_index += 1
                arg_replacement_dict[arg] = f"fun_arg{fun_arg_index - 1}"

            function = function_data_dict[key]["function"]
            args = []

            for arg in function_data_dict[key]["args"]:
                args.append(f"{arg_replacement_dict[arg]}")
            args_str = ", ".join(args)

            code_before_function = function_data_dict[key]["code_before_function"]
            code_after_function = function_data_dict[key]["code_after_function"]

            if function_data_dict[key]["is_parent"] == False:
                output_code_lines.append(
                    f"{paddings}let fun_arg{fun_arg_index} = {code_before_function}{function}({args_str}){code_after_function};"
                )
                key_ = f"{function}({', '.join(processed_args)})"
                defined_args.append(key_)
                arg_replacement_dict[function_data_dict[key]["original_code"]] = (
                    f"fun_arg{fun_arg_index}"
                )
                fun_arg_index += 1
                pass
            else:
                output_code_lines.append(
                    f"{code_before_function}{function}({args_str}){code_after_function}"
                )

        processed_args = []
        for line in output_code_lines:
            try:
                arg = line.split(" = ")[1]
                arg = (
                    arg.replace("&", "")
                    .replace("mut ", "")
                    .replace(";", "")
                    .split(".")[0]
                )
                processed_args.append(arg)
            except:
                pass

        args_that_can_convert_back = []
        for arg in processed_args:
            if processed_args.count(arg) == 1 and "(" not in arg:
                args_that_can_convert_back.append(arg)

        arg_convert_back_replacement_dict = {}

        line_to_remove = []
        for line in output_code_lines:
            try:
                new_arg, old_arg = line.split(" = ")
                arg = (
                    old_arg.replace("&", "")
                    .replace("mut ", "")
                    .replace(";", "")
                    .split(".")[0]
                )
                if arg in args_that_can_convert_back:
                    key = new_arg.replace("let ", "").strip()
                    arg_convert_back_replacement_dict[key] = old_arg.replace(
                        ";", ""
                    ).strip()
                    line_to_remove.append(line)
            except Exception as e:
                pass
        for line in line_to_remove:
            output_code_lines.remove(line)

        output_code = "\n".join(output_code_lines)
        for key, value in arg_convert_back_replacement_dict.items():
            output_code = output_code.replace(key, value)

        return output_code
    except Exception as e:
        # print(e)
        return code_line
