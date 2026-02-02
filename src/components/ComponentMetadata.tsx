"use client";

import { parseComponentMetadata } from "@/lib/componentMetadata";

interface ComponentMetadataProps {
  code: string;
}

export function ComponentMetadataDisplay({ code }: ComponentMetadataProps) {
  if (!code.trim()) return null;

  const { name, props } = parseComponentMetadata(code);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-sm">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Component metadata</h3>
      <dl className="space-y-1 text-gray-600 dark:text-gray-400">
        <div>
          <dt className="inline font-medium">Name: </dt>
          <dd className="inline font-mono">{name}</dd>
        </div>
        {props.length > 0 && (
          <div>
            <dt className="font-medium mb-0.5">Props: </dt>
            <dd className="font-mono text-xs">{props.join(", ") || "—"}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
