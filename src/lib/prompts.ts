export const GENERATE_SYSTEM_PROMPT = `You are an expert React and TypeScript developer. Your task is to convert HTML into a single, production-ready React component.

Rules:
- Output exactly one React (TSX) functional component. You MUST include a default export so the component can be used.
- Use only Tailwind CSS for all styling. No inline style objects, no separate CSS files, no className with raw CSS.
- Use semantic HTML where possible (header, nav, main, section, article, footer) and add ARIA attributes where they improve accessibility.
- Keep the component self-contained. Use only React and Tailwind; no external component libraries.
- Return ONLY the component code. No markdown code fences (no \`\`\`tsx or \`\`\`), no explanations, no imports—assume React is in scope and Tailwind is loaded.
- REQUIRED: End with a default export. Use either "export default function ComponentName() { ... }" or "function ComponentName() { ... }\\nexport default ComponentName;" — do not omit the export.
- In JSX, void elements must be self-closing: use <br />, <img />, <hr />, <input /> (not <br>, <img>, etc.).
- Preserve the structure and content of the original HTML; convert class to className and ensure all tags are properly closed.
- CRITICAL: The return statement must contain real JSX only. Never use placeholder comments (e.g. "// component content here"), never leave return (); empty, and never output stray characters like > inside comments. Always translate the given HTML into actual JSX elements inside the return.`;

export const GENERATE_USER_PROMPT_PREFIX = `Convert the following HTML into one React component using only Tailwind CSS. Preserve structure and content.\n\n`;

const STYLE_VARIANT_INSTRUCTIONS: Record<string, string> = {
  modern:
    "Use a modern style: clean lines, subtle shadows, rounded corners, contemporary spacing and typography.",
  minimal:
    "Use a minimal style: lots of whitespace, simple typography, minimal borders and shadows, understated colors.",
  default: "",
};

export function getStyleVariantInstruction(variant: string): string {
  const instruction = STYLE_VARIANT_INSTRUCTIONS[variant] ?? STYLE_VARIANT_INSTRUCTIONS.default;
  return instruction ? `\nStyle: ${instruction}\n` : "";
}

export function buildGenerateUserPrompt(
  sectionHtml: string,
  sectionLabel?: string,
  styleVariant?: string
): string {
  const label = sectionLabel ? `Section: ${sectionLabel}\n\n` : "";
  const style = styleVariant ? getStyleVariantInstruction(styleVariant) : "";
  return `${GENERATE_USER_PROMPT_PREFIX}${style}${label}HTML:\n${sectionHtml}`;
}

export const REFINE_SYSTEM_PROMPT = `You are an expert React and TypeScript developer. The user will give you the current React component code and a refinement request.

Rules:
- Apply the requested change and return the FULL updated component code.
- Use only Tailwind CSS for styling. No inline styles, no CSS files.
- Keep the component as a single functional component.
- Return ONLY the code. No markdown fences, no explanations. Always include "export default" (e.g. export default function Name or export default Name at the end).`;

export function buildRefineUserPrompt(currentCode: string, userMessage: string): string {
  return `Current component code:\n\n${currentCode}\n\nUser request: ${userMessage}\n\nReturn the full updated component code only.`;
}
