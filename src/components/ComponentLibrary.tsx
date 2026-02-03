"use client";

import { useState, useEffect } from "react";
import {
  getSavedComponents,
  searchSavedComponents,
  deleteSavedComponent,
} from "@/lib/savedComponents";
import type { SavedComponent } from "@/types";

interface ComponentLibraryProps {
  onLoad: (component: SavedComponent) => void;
  onClose?: () => void;
}

export function ComponentLibrary({ onLoad, onClose }: ComponentLibraryProps) {
  const [components, setComponents] = useState<SavedComponent[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setComponents(getSavedComponents());
  }, []);

  const filtered = search.trim()
    ? searchSavedComponents(search)
    : components;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSavedComponent(id);
    setComponents(getSavedComponents());
  };

  return (
    <div className="flex flex-col h-full min-h-[300px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Component library
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
          >
            Close
          </button>
        )}
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or code…"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm mb-3 placeholder-gray-500"
        aria-label="Search components"
      />
      <ul className="flex-1 overflow-auto space-y-2">
        {filtered.length === 0 && (
          <li className="text-sm text-gray-500 dark:text-gray-400 py-6 px-4 text-center rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-600">
            {components.length === 0 ? (
              <>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">No saved components yet</p>
                <p className="text-xs text-left max-w-sm mx-auto space-y-1">
                  1. Paste a URL and click <strong>Scrape</strong><br />
                  2. Select a section and click <strong>Generate component</strong><br />
                  3. In the Code panel, click the green <strong>Save</strong> button<br />
                  4. Your component will appear here. Click it to load it again, or use the search box to find it.
                </p>
              </>
            ) : (
              "No components match your search."
            )}
          </li>
        )}
        {filtered.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
            onClick={() => onLoad(c)}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {c.name}
              </p>
              {c.sectionLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {c.sectionLabel}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => handleDelete(e, c.id)}
              className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40"
              aria-label={`Delete ${c.name}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
