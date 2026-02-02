import { NextResponse } from "next/server";
import { detectSections } from "@/lib/sections";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const html = typeof body?.html === "string" ? body.html : "";

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required." },
        { status: 400 }
      );
    }

    const sections = detectSections(html);
    return NextResponse.json({ sections });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to detect sections.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
