"use client";

import { useRef, useEffect, useCallback, useState } from "react";

type ViewportSize = "desktop" | "mobile";

interface LivePreviewProps {
  code: string;
  className?: string;
}

const MOBILE_WIDTH = 375;

export function LivePreview({ code, className = "" }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const sendCode = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: "PREVIEW_CODE", code }, "*");
  }, [code]);

  useEffect(() => {
    sendCode();
  }, [sendCode]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "PREVIEW_READY") return;
      const iframe = iframeRef.current;
      if (iframe?.contentWindow && event.source === iframe.contentWindow) {
        sendCode();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sendCode]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    sendCode();
    setTimeout(sendCode, 200);
    setTimeout(sendCode, 600);
  }, [sendCode]);

  const showLoading = Boolean(code && !iframeLoaded);

  return (
    <div className={`flex flex-col h-full min-h-[200px] ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Live preview
        </span>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`px-2 py-1 text-xs font-medium ${
              viewport === "desktop"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`px-2 py-1 text-xs font-medium ${
              viewport === "mobile"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-[300px] flex justify-center overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2">
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/90 dark:bg-gray-800/90 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading preview…</p>
          </div>
        )}
        <div
          className={viewport === "mobile" ? "shrink-0 flex flex-col" : "flex-1 min-w-0 w-full flex flex-col"}
          style={viewport === "mobile" ? { width: MOBILE_WIDTH } : undefined}
        >
          <iframe
            ref={iframeRef}
            src="/preview"
            title="Component preview"
            className="flex-1 min-h-[300px] w-full rounded border-0 bg-white dark:bg-gray-900 shadow"
            style={{ minWidth: viewport === "mobile" ? MOBILE_WIDTH : undefined }}
            sandbox="allow-scripts"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}
