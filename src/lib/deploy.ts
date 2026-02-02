/**
 * Open generated component in CodeSandbox or StackBlitz.
 */

function getComponentName(code: string): string {
  const m = code.match(/function\s+(\w+)\s*\(/);
  if (m) return m[1];
  const m2 = code.match(/export\s+default\s+function\s+(\w+)/);
  if (m2) return m[2];
  return "Component";
}

function buildSandboxFiles(componentName: string, code: string): Record<string, { content: string } | { content: object }> {
  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import Component from './${componentName}.tsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);`;
  return {
    "package.json": {
      content: {
        name: "generated-component",
        version: "0.0.1",
        private: true,
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
      },
    },
    "index.html": {
      content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,
    },
    "src/main.jsx": { content: mainJsx },
    [`src/${componentName}.tsx`]: { content: code },
  };
}

export async function openInCodeSandbox(code: string): Promise<void> {
  const name = getComponentName(code);
  const files = buildSandboxFiles(name, code);
  const res = await fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  const data = await res.json().catch(() => ({}));
  const sandboxId = data?.sandbox_id ?? data?.id;
  if (sandboxId) {
    window.open(`https://codesandbox.io/s/${sandboxId}`, "_blank", "noopener");
  } else {
    const msg = data?.error ?? (res.ok ? "No sandbox ID returned" : `Request failed: ${res.status}`);
    throw new Error(msg);
  }
}

export async function openInStackBlitz(code: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    // ignore
  }
  window.open("https://stackblitz.com/edit/react?file=src/App.jsx", "_blank", "noopener");
}
