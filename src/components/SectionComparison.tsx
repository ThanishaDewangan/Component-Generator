"use client";

import { useState } from "react";

interface SectionComparisonProps {
  originalHtml: string;
  generatedPreview: React.ReactNode;
}

export function SectionComparison({ originalHtml, generatedPreview }: SectionComparisonProps) {
  const [activeTab, setActiveTab] = useState<"original" | "generated">("generated");

  return (
    <div className="flex flex-col h-full min-h-[200px]">
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden mb-2">
        <button
          type="button"
          onClick={() => setActiveTab("original")}
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === "original"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          Original
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("generated")}
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === "generated"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          Generated
        </button>
      </div>
      {activeTab === "original" && (
        <div className="flex-1 min-h-[280px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto bg-white dark:bg-gray-900">
          <iframe
            title="Original section"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="p-4">${originalHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")}</body></html>`}
            className="w-full min-h-[280px] border-0 rounded-lg"
            sandbox="allow-same-origin"
          />
        </div>
      )}
      {activeTab === "generated" && (
        <div className="flex-1 min-h-[280px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto">
          {generatedPreview}
        </div>
      )}
    </div>
  );
}
