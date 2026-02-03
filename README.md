# Website → React Component Generator

**Paste a website URL → get editable React + Tailwind components.**

A production-grade tool that scrapes real websites, detects sections, and uses **Groq, Claude, or Google Gemini** to convert selected sections into clean React + Tailwind components. Includes live preview and chat-style refinement. **Use Groq for free (no credit card)** at [console.groq.com](https://console.groq.com); or Gemini/Claude if you prefer.

---

## What You Built

A full-stack web app that lets creators turn any public webpage into reusable React + Tailwind components:

- **Input:** User pastes a public URL (e.g. a landing page).
- **Scrape:** Server fetches the page and extracts HTML, linked CSS, and image URLs (server-side, no headless browser by default).
- **Section detection:** Heuristic logic finds logical blocks (Hero, Features, Pricing, Footer, etc.) using semantic tags and headings.
- **Selection:** User picks one section to convert.
- **AI generation:** Groq, Claude, or Gemini converts that HTML into a single React (TSX) functional component with **Tailwind-only** styling.
- **Live preview:** Generated code runs in an isolated iframe; code on the left, live preview on the right (Desktop/Mobile toggle).
- **Iteration:** Chat-style refinement (“Make it darker”, “Increase spacing”) sends current code + instruction to the AI and updates the component.
- **Code display:** Syntax-highlighted JSX/TSX, copy, download `.tsx`, save to a local component library, and one-click open in CodeSandbox or StackBlitz.

Bonus features include: scrape-failure fallback with iframe view, style variants (Default / Modern / Minimal), original-vs-generated comparison, component metadata display, and a searchable component library (localStorage).

---

## Tech Stack

| Layer   | Choice                    |
|--------|---------------------------|
| App    | Next.js 14 (App Router), React 18, TypeScript |
| Styling| Tailwind CSS              |
| Scraping | Cheerio + fetch (server-side) |
| AI     | **Groq (free, no card)** or Claude or Gemini |
| Preview| iframe + Babel standalone + React 18 UMD |
| Code display | Prism.js (TSX)     |

---

## Architecture

```
User → URL input → POST /api/scrape → HTML + styles + images
     → POST /api/sections → [{ id, label, html }]
     → User selects section → POST /api/generate → { code }
     → Code panel + Live preview (iframe)
     → Refinement chat → POST /api/refine → { code } → update state
```

- **Scraping:** `src/lib/scrape.ts` – fetch + Cheerio; extracts HTML, `<link rel="stylesheet">`, `<style>`, `<img src>`.
- **Sections:** `src/lib/sections.ts` – splits by `<section>`, `<header>`, `<main>`, etc., and by headings; labels from keywords (Hero, Pricing, …).
- **Generate/Refine:** `src/lib/prompts.ts` + `src/lib/ai.ts` – system prompts enforce React + Tailwind only; **AI provider**: Groq (free), Claude, or Gemini. Set `GROQ_API_KEY` (recommended), or `ANTHROPIC_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`.
- **Preview:** `/preview` page loads in iframe; receives code via `postMessage`; Babel transforms JSX; eval in scope with React; errors shown inside iframe so the main app never crashes.

---

## How to Run

1. **Clone and install**

   ```bash
   cd ecomcoder
   npm install
   ```

2. **Environment (pick one — no credit card needed for Groq)**

   Copy `.env.local.example` to `.env.local` and add **one** API key:

   - **Free, no credit card:** Get a Groq API key at [console.groq.com](https://console.groq.com) (sign up with email or GitHub). Set `GROQ_API_KEY=your_key` in `.env.local`.
   - **Free (quota varies by region):** Gemini at [Google AI Studio](https://aistudio.google.com/app/apikey). Set `GOOGLE_GENERATIVE_AI_API_KEY=your_key`.
   - **Paid:** Set `ANTHROPIC_API_KEY=sk-ant-...` for Claude.

3. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), paste a URL, scrape, select a section, generate, and refine as needed.

---

## AI Prompt Strategy

- **Generate:**  
  - **System prompt:** One React (TSX) functional component; Tailwind-only styling (no inline styles, no separate CSS); semantic HTML and ARIA where helpful; self-closing void tags (`<br />`, `<img />`, etc.); **required** default export; no markdown fences or explanations; real JSX only (no placeholder comments or empty `return`).  
  - **User message:** Section HTML + optional section label + optional style variant (Default / Modern / Minimal). The AI preserves structure and content and converts `class` → `className`.  
- **Refine:**  
  - **System prompt:** Apply the user’s change and return the **full** updated component; Tailwind only; code only, no fences.  
  - **User message:** Current component code + refinement instruction (e.g. “Make it darker”, “Increase spacing”).  
- **Post-processing:** Both endpoints strip markdown code fences from the model output (e.g. `\`\`\`tsx … \`\`\``) so only the raw code is stored and shown.

---

## How Scraping Works

- **Method:** Server-side `fetch` (Node.js) plus **Cheerio** to parse HTML. No headless browser; the app never executes the page’s JavaScript.
- **Flow:** `POST /api/scrape` receives a URL, fetches the page with a 15s timeout and a standard User-Agent, then loads the response into Cheerio. We extract:
  - Full HTML (capped at ~1.2MB).
  - Linked stylesheets (`<link rel="stylesheet">`) and inline `<style>` (up to 100KB each).
  - Image URLs from `<img src>` (resolved to absolute URLs using the page’s base).
- **Works well for:** Static and server-rendered pages (marketing sites, docs, many landing pages). Content that is already in the initial HTML is fully available.
- **Section detection** runs on that HTML: we split by semantic tags (`<section>`, `<header>`, `<main>`, `<article>`, `<aside>`, `<footer>`) and by major headings (`<h1>`, `<h2>`, `<h3>`), then label sections using keywords (Hero, Pricing, Footer, etc.). The AI never sees the full page—only the HTML of the section the user selects.

---

## Known Limitations

- **JS-heavy SPAs:** Pages that render most content only after client-side JavaScript runs may return mostly empty or shell HTML. For those, a future “full browser” mode (e.g. Playwright/Puppeteer) would be needed.
- **CORS / bot blocking:** Some sites block non-browser or server requests. We send a clear User-Agent but cannot bypass strict bot protection; scrape may fail with a generic error.
- **Page size:** HTML is capped at ~1.2MB; very large pages are rejected with “Page too large”.
- **Images in preview:** Generated code often uses relative image paths (e.g. `/img/logo.png`). The app rewrites these to absolute URLs using the scraped site’s origin so the preview can load images; the downloaded/saved code keeps relative paths for the user’s own project.
- **AI output:** The model sometimes omits `export default` or uses invalid JSX (e.g. `<br>`). We normalize void tags and infer the component from the function name when needed; prompt rules and retries reduce but do not eliminate these cases.

---

## Bonus Features

**Level 1**

- **Screenshot fallback:** When scrape fails, the app shows the error plus an “Open URL in new tab” link and an iframe view of the page so you can still see it.
- **Mobile + desktop preview:** Toggle “Desktop” / “Mobile” above the live preview to see the component at full width or 375px.
- **Save locally:** Click “Save” in the code panel to store the current component in the browser (localStorage). Name it and load it later from the library.
- **Export .tsx:** Click “Download .tsx” to download the generated component as a `.tsx` file.

**Level 2**

- **Section comparison (original vs generated):** Click “Original vs Generated” to switch the right panel to tabs: “Original” (scraped HTML) and “Generated” (live preview).
- **Style variants:** Before generating, choose “Default”, “Modern”, or “Minimal” in the “Style variant” dropdown; the AI applies that style.
- **Component metadata:** When code is present, the app shows parsed component name and props (when detectable).

**Level 3**

- **Component library:** Click “Component library” in the header to open a list of saved components. Search by name or code; click to load, or delete.
- **Semantic search:** The library search filters by component name, section label, and code content.
- **One-click deploy:** Use “Open in CodeSandbox” or “Open in StackBlitz” to open the current component in a new tab (CodeSandbox creates a sandbox; StackBlitz opens the React template and copies the code).

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── preview/page.tsx
│   └── api/
│       ├── scrape, sections, generate, refine, provider
├── components/
│   ├── UrlInput, SectionSelector, CodePanel, LivePreview, RefinementChat
│   ├── ScrapeFallback, SectionComparison, ComponentMetadata, ComponentLibrary
├── lib/
│   ├── scrape, sections, prompts, validateUrl, ai, savedComponents, componentMetadata, deploy
└── types/
    └── index.ts
```

---

## Example URLs to Try

- Simple marketing or landing pages (e.g. [tailwindui.com](https://tailwindui.com) components or similar).
- Any public, static or SSR page with clear sections (hero, features, pricing, footer).

Avoid (for best results): login-walled pages, heavy client-only SPAs, or sites that aggressively block scrapers.

---

## No credits? Use Groq (free, no credit card)

If you don’t have Claude or Gemini quota, use **Groq**:

1. Go to [console.groq.com](https://console.groq.com) and sign up (email or GitHub).
2. Create an API key in the dashboard (free tier, no credit card).
3. In `.env.local` set: `GROQ_API_KEY=your_key`.
4. Restart `npm run dev` — generate and refine will use Groq.

The app prefers Groq when `GROQ_API_KEY` is set; then Claude; then Gemini.

---

## Deploy

**Vercel (recommended for Next.js)**

1. Push the repo to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **Add New → Project** and import this repo.
4. Leave **Framework Preset** as Next.js and **Root Directory** as `.`; click **Deploy**.
5. After the first deploy, go to **Settings → Environment Variables** and add one of:
   - `GROQ_API_KEY` (free, recommended)
   - `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`
   - `ANTHROPIC_API_KEY`
6. Redeploy (Deployments → ⋮ → Redeploy) so the app picks up the env var.

**From your machine (optional)**

- Install Vercel CLI: `npm i -g vercel`
- In the project folder: `vercel` (follow prompts, then `vercel --prod` for production).

**Netlify**

- Connect the repo at [netlify.com](https://netlify.com). Use the detected Next.js build (`npm run build`). Add env vars in **Site settings → Environment variables**.

---

## Live Demo

**[Add your deployed URL here]** (e.g. `https://website-to-react-generator.vercel.app`)

Works without setup. Add one AI API key in the hosting dashboard (see [How to Run](#how-to-run)).

**Example URLs to test**

- [https://htmx.org](https://htmx.org) – small, clear sections (e.g. Footer).
- [https://tailwindcss.com](https://tailwindcss.com) – larger page; try a section like Hero or Features.
- [https://stripe.com](https://stripe.com) – marketing layout with clear blocks.

---

## Screenshots / Demo

**For submission:** Add your own assets:

1. **Screenshots:** Save as `docs/generator.png` (main flow: URL → sections → code + live preview) and `docs/library.png` (component library + search).
2. **Demo GIF (optional):** Record a short GIF of the flow and save as `docs/demo.gif`.
3. **Screen recording (3–5 min):** Upload to Loom/YouTube/Drive and paste the link below.

| Main flow (URL → scrape → section → generate → preview) | Component library + search |
|----------------------------------------------------------|-----------------------------|
| ![Generator](./docs/generator.png)                        | ![Library](./docs/library.png) |

**Demo video (3–5 min):** [Add link to your screen recording] — show: URL → scrape → section selection → generate → live preview → refinement → error handling.

---

## Technical Write-up

### What was the hardest part?

The hardest part was **making the live preview reliable** without crashing the app. Generated code can have invalid JSX (e.g. `<br>` instead of `<br />`), missing `export default`, or syntax errors. We had to: (1) run the code in an isolated iframe so failures don’t affect the main app; (2) normalize common issues (e.g. `<br>` → `<br />`) before passing code to Babel; (3) add a fallback so that when the model omits `export default`, we still detect the component (e.g. by parsing `function ComponentName(`) and assign it for rendering; (4) handle timing—the iframe loads React/ReactDOM/Babel asynchronously, so we only post `PREVIEW_READY` once those globals exist, and we retry once if code arrives before libs are loaded. Getting the right balance between “fix in the prompt” and “fix in the preview” took iteration.

### How did you decide component boundaries?

**App components:** Boundaries were chosen by **responsibility**—URL + scrape → `UrlInput`; section list + style variant + generate → `SectionSelector`; code display + copy + download + save → `CodePanel`; isolated preview + viewport toggle → `LivePreview`; refinement chat → `RefinementChat`; fallback UI → `ScrapeFallback`; original vs generated tabs → `SectionComparison`; metadata display → `ComponentMetadataDisplay`; saved components → `ComponentLibrary`.

**Section detection (page → blocks):** Boundaries are **heuristic**, not AI-based. We split on semantic tags (`<section>`, `<header>`, `<main>`, `<article>`, `<aside>`, `<footer>`) and on major headings (`<h1>`, `<h2>`, `<h3>`), then label sections (Hero, Pricing, Footer, etc.) from keywords in the tag name and first heading. We did not use AI for section boundaries to keep the pipeline fast and deterministic; the AI is used only for HTML → React + Tailwind conversion and for refinement.

### What broke, and how did you handle it?

- **Scraping:** Some sites block or timeout. We added a **scrape fallback**: when scrape fails, we show the error, an “Open URL in new tab” link, and an iframe pointing at the URL so the user can still view the page. We only show "Scrape failed" after the request actually fails (not before it starts).
- **AI quota (Gemini):** Free tier often hit rate limits or “quota unavailable”. We added **Groq** as a free, no-credit-card option and made the app prefer Groq when `GROQ_API_KEY` is set; we surface a clear message when Gemini quota is exceeded and suggest Claude or Groq.
- **Preview errors:** Invalid JSX (e.g. `<br>`) and missing `export default` caused “Generated code did not export a component” or Babel errors. We **normalize** `<br>` / `<hr>` to self-closing in the preview, **strengthened prompts** to require default export, self-closing void tags, and real JSX (no placeholder comments), and added a **fallback** that infers the component from `function Name(` when no export is present.
- **"Libraries not loaded" in preview:** The iframe sometimes received code before React/ReactDOM/Babel were on `window`. We only post `PREVIEW_READY` once those globals exist, and we retry rendering once after a short delay if the first attempt fails due to missing libs.
- **Image 404s in preview:** Generated code used relative paths (e.g. `/img/logo.png`), so the browser requested them from our origin. We store the scraped URL and rewrite relative `src="/..."` to absolute URLs only for the preview; saved/downloaded code keeps relative paths.
- **Build / types:** Prism.js and Cheerio types caused build failures. We fixed Prism by loading it only on the client with dynamic imports and `@ts-ignore` for untyped modules; we fixed Cheerio by casting the node to a type that has `tagName`/`name`. We also fixed Gemini `systemInstruction` (under `config` in `@google/genai`) and regex typo in deploy (`m[2]` → `m2[1]`).

### How did you use AI in your workflow?

AI is used in two places: (1) **Generate** — the AI converts scraped section HTML into a single React + Tailwind component; (2) **Refine** — the AI takes the current code and the user’s instruction (e.g. “Make it darker”) and returns the full updated component. System prompts enforce: functional React, Tailwind only, no raw CSS, semantic/accessible markup, code-only output (no markdown fences), and strict JSX rules (self-closing tags, real content in `return`). We support multiple providers (Groq, Claude, Gemini) so users can choose based on cost and availability; the app picks Groq first, then Claude, then Gemini based on env vars.

### What would you improve with more time?

- **Scraping:** Add **Playwright** (or Puppeteer) as an option for JS-heavy SPAs, with a clear “full browser” mode and documented limitations.
- **Section detection:** Optionally use AI to suggest or refine section boundaries and labels for noisy pages.
- **Multi-section export:** Allow selecting multiple sections and generate a single file (or multiple components) with clear boundaries.
- **Deploy flow:** Improve **StackBlitz** integration (e.g. use their run API with project payload instead of “copy + open template”) and add **CodeSandbox** template validation.
- **Component metadata:** Use a small parser or AI to extract props/variants and surface them in the library and in export.
- **Tests:** Add unit tests for section detection, URL rewriting, and code extraction; add a minimal E2E test for the main flow.

---

## Deploy (e.g. Vercel)

1. Push to GitHub and connect the repo to Vercel.
2. Set **one** of `GROQ_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, or `ANTHROPIC_API_KEY` in the project environment variables.
3. Deploy. The app works without extra setup; scraping runs on the server.

---
Deployed Link: https://component-generator-6ldr-700zym95c.vercel.app/

## License

MIT.
