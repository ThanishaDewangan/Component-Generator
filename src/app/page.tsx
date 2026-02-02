"use client";

import { useState, useCallback, useEffect } from "react";
import { UrlInput } from "@/components/UrlInput";
import { SectionSelector } from "@/components/SectionSelector";
import { CodePanel } from "@/components/CodePanel";
import { LivePreview } from "@/components/LivePreview";
import { RefinementChat } from "@/components/RefinementChat";
import { ScrapeFallback } from "@/components/ScrapeFallback";
import { SectionComparison } from "@/components/SectionComparison";
import { ComponentMetadataDisplay } from "@/components/ComponentMetadata";
import { ComponentLibrary } from "@/components/ComponentLibrary";
import { saveComponent } from "@/lib/savedComponents";
import { openInCodeSandbox, openInStackBlitz } from "@/lib/deploy";
import type { Section } from "@/types";
import type { SavedComponent } from "@/types";

function rewriteImageUrlsForPreview(code: string, baseUrl: string): string {
  if (!baseUrl.trim()) return code;
  try {
    const origin = new URL(baseUrl).origin;
    return code.replace(/src="\/([^"]*)"/g, `src="${origin}/$1"`);
  } catch {
    return code;
  }
}

export default function Home() {
  const [scrapedHtml, setScrapedHtml] = useState<string | null>(null);
  const [scrapedUrl, setScrapedUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/provider")
      .then((r) => r.json())
      .then((d) => setAiProvider(d.provider ?? null))
      .catch(() => setAiProvider(null));
  }, []);

  const [scrapeFailedUrl, setScrapeFailedUrl] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleScrape = useCallback(async (url: string) => {
    setSectionsError(null);
    setScrapeFailedUrl(null);
    setSections([]);
    setSelectedSection(null);
    setSelectedId(null);
    setCode("");
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      setScrapeFailedUrl(url);
      throw new Error(data.error ?? "Scrape failed");
    }
    setScrapeFailedUrl(null);
    setScrapedUrl(url);
    setScrapedHtml(data.html);
    const sectionsRes = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: data.html }),
    });
    const sectionsData = await sectionsRes.json();
    if (!sectionsRes.ok) {
      setSectionsError(sectionsData.error ?? "Section detection failed");
      setSections([]);
      return;
    }
    setSections(sectionsData.sections ?? []);
  }, []);

  const handleSelectSection = useCallback((section: Section) => {
    setSelectedSection(section);
    setSelectedId(section.id);
  }, []);

  const handleGenerate = useCallback(async (styleVariant?: string) => {
    if (!selectedSection) return;
    setSectionsError(null);
    setGenerateLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionHtml: selectedSection.html,
          sectionLabel: selectedSection.label,
          styleVariant: styleVariant || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setCode(data.code ?? "");
    } catch (err) {
      setSectionsError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerateLoading(false);
    }
  }, [selectedSection]);

  const handleSave = useCallback(
    (name: string) => {
      saveComponent({
        name,
        code,
        sectionLabel: selectedSection?.label,
        originalHtml: selectedSection?.html,
      });
    },
    [code, selectedSection]
  );

  const handleLoadFromLibrary = useCallback((component: SavedComponent) => {
    setCode(component.code);
    setShowLibrary(false);
  }, []);

  const handleRefine = useCallback(async (message: string) => {
    if (!code) return;
    const res = await fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentCode: code, userMessage: message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Refinement failed");
    setCode(data.code ?? "");
  }, [code]);

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Website → React Component Generator
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Paste a URL, select a section, and get editable React + Tailwind components.
        </p>
        {aiProvider && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Using: <span className="font-medium capitalize">{aiProvider}</span>
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Component library
          </button>
        </div>
      </header>

      {showLibrary && (
        <div className="mb-6">
          <ComponentLibrary onLoad={handleLoadFromLibrary} onClose={() => setShowLibrary(false)} />
        </div>
      )}

      <section className="mb-6">
        <UrlInput
          onScrape={handleScrape}
          onScrapeError={(failedUrl) => {
            setScrapeFailedUrl(failedUrl);
          }}
        />
      </section>

      {scrapeFailedUrl && (
        <ScrapeFallback
          url={scrapeFailedUrl}
          message="Scrape failed. You can view the page below or open it in a new tab."
          onDismiss={() => setScrapeFailedUrl(null)}
        />
      )}

      {sectionsError && !scrapeFailedUrl && (
        <div
          className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm"
          role="alert"
        >
          {sectionsError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          {scrapedHtml && (
            <SectionSelector
              sections={sections}
              selectedId={selectedId}
              onSelect={handleSelectSection}
              onGenerate={handleGenerate}
              generating={generateLoading}
              disabled={!selectedSection}
            />
          )}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {code && (
            <div className="flex flex-wrap items-center gap-2">
              <ComponentMetadataDisplay code={code} />
              <button
                type="button"
                onClick={() => setShowComparison(!showComparison)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {showComparison ? "Hide" : "Original vs Generated"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await openInCodeSandbox(code);
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Failed to open CodeSandbox");
                  }
                }}
                className="px-3 py-1.5 text-sm rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800/40"
              >
                Open in CodeSandbox
              </button>
              <button
                type="button"
                onClick={() => openInStackBlitz(code)}
                className="px-3 py-1.5 text-sm rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/40"
              >
                Open in StackBlitz
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex flex-col min-h-[320px]">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Code
              </h2>
              <div className="flex-1 min-h-[280px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <CodePanel
                  code={code}
                  onSave={handleSave}
                  defaultFileName={selectedSection ? `${selectedSection.label.replace(/\s+/g, "")}.tsx` : undefined}
                />
              </div>
            </div>
            <div className="flex flex-col min-h-[320px]">
              {showComparison && selectedSection && code ? (
                <SectionComparison
                  originalHtml={selectedSection.html}
                  generatedPreview={
                    <LivePreview
                      code={rewriteImageUrlsForPreview(code, scrapedUrl ?? "")}
                      className="min-h-[300px]"
                    />
                  }
                />
              ) : (
                <LivePreview code={rewriteImageUrlsForPreview(code, scrapedUrl ?? "")} />
              )}
            </div>
          </div>

          {code && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <RefinementChat onRefine={handleRefine} disabled={!code} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
