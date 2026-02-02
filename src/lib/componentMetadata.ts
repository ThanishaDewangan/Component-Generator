/**
 * Parse component name and optional props from generated React code.
 */
export interface ComponentMetadata {
  name: string;
  props: string[];
}

export function parseComponentMetadata(code: string): ComponentMetadata {
  const nameMatch = code.match(/function\s+(\w+)\s*\(/);
  const name = nameMatch?.[1] ?? "Component";

  const props: string[] = [];
  const propsMatch = code.match(/function\s+\w+\s*\(\s*\{\s*([^}]*)\s*\}\s*\)/);
  if (propsMatch?.[1]) {
    const propsStr = propsMatch[1];
    propsStr.split(",").forEach((p) => {
      const trimmed = p.trim().split(":")[0].trim();
      if (trimmed && !trimmed.startsWith("//")) props.push(trimmed);
    });
  }
  const arrowPropsMatch = code.match(/const\s+\w+\s*=\s*\(\s*\{\s*([^}]*)\s*\}\s*\)\s*=>/);
  if (arrowPropsMatch?.[1] && props.length === 0) {
    arrowPropsMatch[1].split(",").forEach((p) => {
      const trimmed = p.trim().split(":")[0].trim();
      if (trimmed && !trimmed.startsWith("//")) props.push(trimmed);
    });
  }

  return { name, props };
}
