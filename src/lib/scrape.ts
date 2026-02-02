import * as cheerio from "cheerio";
import type { ScrapedPage } from "@/types";

const MAX_HTML_LENGTH = 1_200_000; // ~1.2MB — allows tailwindcss.com, stripe.com, etc.
const MAX_STYLE_LENGTH = 100_000;
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetches a URL and extracts HTML, linked CSS, and image URLs.
 * Best for static/SSR pages; JS-heavy SPAs may not render correctly.
 */
export async function scrapeUrl(url: string): Promise<ScrapedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; WebsiteToReactGenerator/1.0; +https://github.com/website-to-react)",
    },
    redirect: "follow",
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  if (html.length > MAX_HTML_LENGTH) {
    throw new Error(
      `Page too large (${(html.length / 1000).toFixed(0)}KB). Try a simpler page.`
    );
  }

  const $ = cheerio.load(html);
  const baseUrl = new URL(response.url);

  const styles: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        const absolute = new URL(href, baseUrl).href;
        styles.push(absolute);
      } catch {
        // skip invalid URLs
      }
    }
  });
  $("style").each((_, el) => {
    const text = $(el).html()?.trim();
    if (text && text.length < MAX_STYLE_LENGTH) styles.push(`/* inline */\n${text}`);
  });

  const images: string[] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      try {
        const absolute = new URL(src, baseUrl).href;
        if (absolute.startsWith("http")) images.push(absolute);
      } catch {
        // skip
      }
    }
  });

  const title = $("title").text().trim() || $("h1").first().text().trim() || "Untitled";

  return {
    html: $.html(),
    styles,
    images,
    title,
  };
}
