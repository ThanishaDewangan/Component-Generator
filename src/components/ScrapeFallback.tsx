"use client";

interface ScrapeFallbackProps {
  url: string;
  message: string;
  onDismiss?: () => void;
}

export function ScrapeFallback({ url, message, onDismiss }: ScrapeFallbackProps) {
  return (
    <div className="mb-4 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <p className="text-sm text-amber-800 dark:text-amber-200 mb-2" role="alert">
        {message}
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
        View the page directly (screenshot fallback):
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700"
        >
          Open URL in new tab
        </a>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Dismiss
          </button>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900" style={{ height: 400 }}>
        <iframe
          src={url}
          title="Page fallback view"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
