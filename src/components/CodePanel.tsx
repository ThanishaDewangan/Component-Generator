"use client";

import { useRef, useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/themes/prism-tomorrow.css";

interface CodePanelProps {
  code: string;
  onCopy?: () => void;
  onSave?: (name: string) => void;
  defaultFileName?: string;
}

function getComponentName(code: string): string {
  const m = code.match(/function\s+(\w+)\s*\(/);
  if (m) return m[1];
  const m2 = code.match(/export\s+default\s+function\s+(\w+)/);
  if (m2) return m2[1];
  return "Component";
}

export function CodePanel({ code, onCopy, onSave, defaultFileName }: CodePanelProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (codeRef.current && code) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadTsx = () => {
    const name = defaultFileName ?? `${getComponentName(code)}.tsx`;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name.endsWith(".tsx") ? name : `${name}.tsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveClick = () => {
    setSaveName(getComponentName(code));
    setShowSaveModal(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveName.trim() && onSave) {
      onSave(saveName.trim());
      setShowSaveModal(false);
    }
  };

  if (!code) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Generated code will appear here.
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex flex-wrap justify-end gap-1 mb-1">
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleDownloadTsx}
          className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
        >
          Download .tsx
        </button>
        {onSave && (
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-3 py-1 text-sm rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40 text-green-800 dark:text-green-200"
          >
            Save
          </button>
        )}
      </div>
      {showSaveModal && onSave && (
        <form
          onSubmit={handleSaveSubmit}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-lg"
        >
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Save as
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-3"
              placeholder="Component name"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm rounded bg-green-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}
      <pre
        className="flex-1 overflow-auto p-4 rounded-lg bg-[#2d2d2d] text-sm font-mono whitespace-pre"
        style={{ minHeight: 200 }}
      >
        <code ref={codeRef} className="language-jsx">
          {code}
        </code>
      </pre>
    </div>
  );
}
