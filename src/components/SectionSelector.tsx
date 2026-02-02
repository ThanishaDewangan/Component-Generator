"use client";

import { useState } from "react";
import type { Section } from "@/types";

const STYLE_VARIANTS = [
  { value: "", label: "Default" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
] as const;

interface SectionSelectorProps {
  sections: Section[];
  selectedId: string | null;
  onSelect: (section: Section) => void;
  onGenerate: (styleVariant?: string) => void;
  generating?: boolean;
  disabled?: boolean;
}

export function SectionSelector({
  sections,
  selectedId,
  onSelect,
  onGenerate,
  generating,
  disabled,
}: SectionSelectorProps) {
  const [styleVariant, setStyleVariant] = useState("");

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Select a section to convert
      </h2>
      <ul className="space-y-1.5 max-h-64 overflow-y-auto" role="listbox" aria-label="Page sections">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onSelect(section)}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                selectedId === section.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200"
              }`}
              role="option"
              aria-selected={selectedId === section.id}
            >
              <span className="font-medium">{section.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        Style variant
      </label>
      <select
        value={styleVariant}
        onChange={(e) => setStyleVariant(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
      >
        {STYLE_VARIANTS.map((v) => (
          <option key={v.value || "default"} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onGenerate(styleVariant || undefined)}
        disabled={disabled || !selectedId || generating}
        className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {generating ? "Generating…" : "Generate component"}
      </button>
    </div>
  );
}
