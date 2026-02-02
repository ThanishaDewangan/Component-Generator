import { NextResponse } from "next/server";
import { validateUrl } from "@/lib/validateUrl";
import { scrapeUrl } from "@/lib/scrape";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    const { valid, error } = validateUrl(url);
    if (!valid) {
      return NextResponse.json({ error: error ?? "Invalid URL." }, { status: 400 });
    }

    const result = await scrapeUrl(url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to scrape URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
