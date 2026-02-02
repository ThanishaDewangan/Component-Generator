"use client";

import { useState, useCallback } from "react";
import { validateUrl } from "@/lib/validateUrl";

interface UrlInputProps {
  onScrape: (url: string) => Promise<void>;
  onScrapeError?: (url: string, message: string) => void;
  disabled?: boolean;
}

export function UrlInput({ onScrape, onScrapeError, disabled }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmed = url.trim();
      if (!trimmed) {
        setError("Please enter a URL.");
        return;
      }
      const { valid, error: validationError } = validateUrl(trimmed);
      if (!valid) {
        setError(validationError ?? "Invalid URL.");
        return;
      }
      setLoading(true);
      try {
        await onScrape(trimmed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to scrape.";
        setError(msg);
        onScrapeError?.(trimmed, msg);
      } finally {
        setLoading(false);
      }
    },
    [url, onScrape]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://example.com"
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          disabled={disabled || loading}
          aria-label="Website URL"
          aria-invalid={!!error}
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Scraping…" : "Scrape"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
