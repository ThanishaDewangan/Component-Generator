# Website → React Component Generator — Implementation Plan

## Overview

A Next.js app that: **Paste URL → Scrape → Detect sections → Select → AI generates React + Tailwind → Live preview + iterative chat refinement.**

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | API routes + SSR, Vercel-ready |
| UI | React 18, Tailwind CSS | Required stack |
| Scraping | Cheerio + optional fetch | No browser needed for most sites; document limitations for JS-heavy |
| AI | Claude (Anthropic API) | Component generation + refinement |
| Preview | iframe + dynamic module eval (sanitized) or react-live | Isolated, safe preview |
| Code display | Prism or highlight.js | Syntax-highlighted TSX |
| Language | TypeScript | Required |

**Scraping note:** We'll use **Cheerio + fetch** first (simpler, no Playwright install). README will document: "Best for static/SSR pages; JS-heavy SPAs may need Playwright." We can add Playwright later as an option.

**Claude (Anthropic):** Use `@anthropic-ai/sdk` with the Messages API. Model: `claude-sonnet-4-20250514` or `claude-3-5-sonnet` (or latest stable). Env: `ANTHROPIC_API_KEY`. Same system/user prompts work; extract code from Claude’s text response (strip markdown fences if present).

---

## Folder Structure

```
ecomcoder/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Main app: URL input, section list, preview, chat
│   │   ├── globals.css
│   │   └── api/
│   │       ├── scrape/route.ts      # POST { url } → HTML + metadata
│   │       ├── sections/route.ts    # POST { html } → detected sections
│   │       ├── generate/route.ts    # POST { sectionHtml, sectionIndex } → React component
│   │       └── refine/route.ts      # POST { currentCode, userMessage } → refined component
│   ├── components/
│   │   ├── UrlInput.tsx             # URL field, validate, loading, error
│   │   ├── SectionSelector.tsx      # List of sections, multi-select
│   │   ├── CodePanel.tsx            # Syntax-highlighted code, copy button
│   │   ├── LivePreview.tsx          # iframe/sandbox with generated component
│   │   ├── RefinementChat.tsx       # Chat input + history, call refine API
│   │   └── ui/                     # Buttons, cards, etc. (minimal)
│   ├── lib/
│   │   ├── scrape.ts                # Fetch + Cheerio: get HTML, extract CSS, images
│   │   ├── sections.ts              # Heuristic section detection (headings, semantic tags)
│   │   ├── prompts.ts               # System + user prompts for generate & refine
│   │   └── validateUrl.ts           # Public URL validation
│   └── types/
│       └── index.ts                 # ScrapedPage, Section, Api types
├── public/
├── .env.local.example               # ANTHROPIC_API_KEY
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── PLAN.md (this file)
```

---

## Data Flow

1. **User pastes URL** → `UrlInput` validates (public URL, no localhost in prod) → calls `POST /api/scrape`.
2. **Scrape** → Server fetches URL, parses with Cheerio, extracts HTML, linked CSS, image URLs → returns `{ html, styles, images, title }`.
3. **Section detection** → `POST /api/sections` with HTML → heuristic (e.g. `<section>`, `<header>`, blocks between `<h1>`–`<h2>`, max N sections) → returns `[{ id, label, html }]`.
4. **User selects section(s)** → `SectionSelector` shows list; user picks one (or we take first for MVP).
5. **Generate** → `POST /api/generate` with selected section HTML + index → Claude (Anthropic API) with system prompt (React, Tailwind only, functional, readable) → returns `{ code }`.
6. **Code + Preview** → `CodePanel` shows code (syntax highlight, copy); `LivePreview` renders in iframe/sandbox; errors in code show message in preview, don’t crash app.
7. **Refine** → User types in `RefinementChat` → `POST /api/refine` with current code + message → Claude returns updated code → state updates → preview and code panel refresh.

---

## API Contracts (TypeScript)

```ts
// POST /api/scrape
Body: { url: string }
Response: { html: string; styles: string[]; images: string[]; title: string } | { error: string }

// POST /api/sections  
Body: { html: string }
Response: { sections: { id: string; label: string; html: string }[] } | { error: string }

// POST /api/generate
Body: { sectionHtml: string; sectionLabel?: string }
Response: { code: string } | { error: string }

// POST /api/refine
Body: { currentCode: string; userMessage: string }
Response: { code: string } | { error: string }
```

---

## Section Detection (Heuristic)

- Split by: `<section>`, `<header>`, `<main>`, `<article>`, or blocks between major headings (`<h1>`–`<h6>`).
- Assign labels: "Hero", "Features", "Pricing", "Testimonials", "Footer", or "Section 1", "Section 2", etc., from heading text or tag.
- Limit to ~20 sections; min length to avoid tiny fragments.
- Return array of `{ id, label, html }` for selection.

---

## AI Prompt Strategy

- **Generate:**  
  - System: "You are an expert React developer. Output a single React (TSX) component. Use only Tailwind CSS for styling. No inline styles, no CSS files. Functional component. Clean, readable, accessible (semantic HTML, aria where needed). Return only the component code, no markdown fences."
  - User: Provide section HTML (cleaned) + "Convert this into one React component with Tailwind."
- **Refine:**  
  - System: Same as above + "Apply the user's requested change and return the full updated component. Output only code."
  - User: Current code + user message (e.g. "Make it darker", "Increase spacing").

---

## Live Preview Safety

- Render in **iframe** with a small runner page that:
  - Receives code via postMessage or query param (if small) or sessionStorage.
  - Compiles TSX to JS (e.g. Babel standalone or Sucrase in worker) and renders in React root.
- Or use **react-live** in an iframe so we don’t run arbitrary code in main app.
- Catch errors and show "Preview error: ..." inside the iframe so main app never crashes.

---

## Error Handling

- Scrape: network error, CORS, non-200 → clear error message in UI.
- Sections: empty or invalid HTML → fallback to single "Full page" section.
- Generate/Refine: API errors → show in chat or toast; keep previous code.
- Preview: try/catch around eval/render; show error state in preview pane.

---

## UI Layout (Main Page)

- **Top:** URL input (paste, validate, "Scrape" button) + loading/error.
- **Left column (or top on mobile):** Section list (cards or list) → select one → "Generate component".
- **Middle:** Code panel (tabs if multiple files; copy button).
- **Right:** Live preview (responsive iframe).
- **Bottom:** Refinement chat (input + optional history) → on send, call refine, update code + preview.

---

## Deliverables Checklist

- [ ] Input: URL field, validation, loading/error states, responsive.
- [ ] Scraping: server-side, HTML + CSS + images extraction, README limitations.
- [ ] Section detection: heuristic, user can select section(s).
- [ ] AI generation: Claude (Anthropic API), React + Tailwind only, system prompt enforced.
- [ ] Live preview: isolated, safe, updates on regenerate; errors don’t crash app.
- [ ] Iteration: chat-style refine with context.
- [ ] Code display: syntax-highlighted, copy, clean formatting.
- [ ] TypeScript, clean structure, error handling, no console warnings.
- [ ] README: what we built, architecture, scraping, prompts, limitations, screenshots/demo.

---

## Optional (Bonus) — If Time

- Export .tsx file.
- Mobile/desktop preview toggle.
- Save components locally (localStorage).
- Screenshot fallback for failed scrape.

---

## What I Will Do Next (After Your Approval)

1. Initialize Next.js app with TypeScript and Tailwind.
2. Add `src/app`, `src/components`, `src/lib`, `src/types` and implement all routes and components as above.
3. Implement scrape (Cheerio + fetch), sections (heuristic), generate + refine (Claude via Anthropic API), and safe preview.
4. Wire UI: URL → scrape → sections → select → generate → code + preview → refine chat.
5. Add README with architecture, prompts, limitations, and usage.
6. Add `.env.local.example` for `ANTHROPIC_API_KEY`.

If you approve this plan, reply **"Approved"** or specify changes (e.g. use Playwright instead of Cheerio, or different layout), and I’ll proceed with implementation.
