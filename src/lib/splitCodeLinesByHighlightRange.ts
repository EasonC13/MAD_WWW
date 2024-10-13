export function splitCodeLinesByHighlightRange(
  code: string,
  highlightRange: string
) {
  try {
    const lines = code.split("\n");
    const [start, end] = highlightRange.split("-").map(Number);

    let codeBefore = lines.slice(0, start - 1).join("\n");
    let codeHighlight = lines.slice(start - 1, end).join("\n");
    let codeAfter = lines.slice(end).join("\n");

    if (codeBefore.endsWith("\n")) {
      codeBefore += " ";
    }
    if (codeHighlight.endsWith("\n")) {
      codeHighlight += " ";
    }
    if (codeAfter.endsWith("\n")) {
      codeAfter += " ";
    }

    return { codeBefore, codeHighlight, codeAfter, start, end };
  } catch (e) {
    return { codeBefore: code, codeHighlight: "", codeAfter: "" };
  }
}
