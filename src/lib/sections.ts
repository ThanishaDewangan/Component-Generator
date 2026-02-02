import * as cheerio from "cheerio";
import type { Section } from "@/types";

const MAX_SECTIONS = 20;
const MIN_SECTION_HTML_LENGTH = 100;

const LABEL_KEYWORDS: Record<string, string> = {
  hero: "Hero",
  header: "Header",
  nav: "Navigation",
  main: "Main",
  footer: "Footer",
  pricing: "Pricing",
  testimonial: "Testimonials",
  feature: "Features",
  cta: "Call to Action",
  about: "About",
  contact: "Contact",
  blog: "Blog",
  team: "Team",
  faq: "FAQ",
};

function inferLabel(html: string, tagName: string, headingText: string): string {
  const lower = `${tagName} ${headingText}`.toLowerCase();
  for (const [key, label] of Object.entries(LABEL_KEYWORDS)) {
    if (lower.includes(key)) return label;
  }
  const h = headingText.trim().slice(0, 40);
  return h || `${tagName} Section`;
}

/**
 * Detects logical page sections using semantic tags and headings.
 * Returns array of { id, label, html } for user selection.
 */
export function detectSections(html: string): Section[] {
  const $ = cheerio.load(html);
  const sections: Section[] = [];
  const seen = new Set<string>();

  const sectionTags = ["section", "header", "main", "article", "aside", "footer"];
  const blockSelector = sectionTags.join(", ");

  $(blockSelector).each((index, el) => {
    if (sections.length >= MAX_SECTIONS) return false; // break

    const $el = $(el);
    const rawTag = (el as { tagName?: string; name?: string }).tagName ?? (el as { name?: string }).name;
    const tagName = (rawTag ?? "section").toLowerCase();
    const outerHtml = $.html($el);
    if (outerHtml.length < MIN_SECTION_HTML_LENGTH) return;

    const firstHeading = $el.find("h1, h2, h3, h4, h5, h6").first().text().trim();
    const label = inferLabel(outerHtml, tagName, firstHeading);
    const id = `section-${index}-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const key = `${tagName}-${firstHeading.slice(0, 20)}`;
    if (seen.has(key)) return;
    seen.add(key);

    sections.push({ id, label, html: outerHtml });
  });

  if (sections.length > 0) return sections;

  // Fallback: split by major headings
  const headings = $("h1, h2, h3");
  if (headings.length === 0) {
    const body = $("body").html()?.trim();
    if (body && body.length >= MIN_SECTION_HTML_LENGTH) {
      return [{ id: "section-0-full", label: "Full page", html: body }];
    }
    return [{ id: "section-0-full", label: "Full page", html }];
  }

  headings.each((index, el) => {
    if (sections.length >= MAX_SECTIONS) return false;
    const $el = $(el);
    const label = $el.text().trim().slice(0, 40) || `Section ${index + 1}`;
    const container = $("<div>").append($el.nextUntil("h1, h2, h3").addBack().clone());
    const blockHtml = $.html(container);
    if (blockHtml.length < MIN_SECTION_HTML_LENGTH) return;
    sections.push({
      id: `section-${index}-${label.replace(/\s+/g, "-").toLowerCase()}`,
      label,
      html: blockHtml,
    });
  });

  if (sections.length === 0) {
    const body = $("body").html()?.trim() || html;
    return [{ id: "section-0-full", label: "Full page", html: body }];
  }

  return sections;
}
