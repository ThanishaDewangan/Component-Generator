"use client";

import { useState, useRef } from "react";

interface RefinementChatProps {
  onRefine: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function RefinementChat({
  onRefine,
  disabled,
  placeholder = "e.g. Make it darker, increase spacing, use Inter font…",
}: RefinementChatProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled || loading) return;
    setError(null);
    setLoading(true);
    try {
      await onRefine(trimmed);
      setMessage("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="refinement-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Refine component
      </label>
      <div className="flex gap-2">
        <input
          id="refinement-input"
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          aria-label="Refinement instruction"
        />
        <button
          type="submit"
          disabled={disabled || loading || !message.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "…" : "Apply"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
