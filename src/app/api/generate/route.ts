import { NextResponse } from "next/server";
import { generateWithAI } from "@/lib/ai";
import {
  GENERATE_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
} from "@/lib/prompts";

function extractCode(text: string): string {
  let out = text.trim();
  const fenceMatch = out.match(/```(?:tsx?|jsx?|javascript)?\s*([\s\S]*?)```/);
  const inner = fenceMatch?.[1]?.trim();
  if (inner) out = inner;
  return out;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sectionHtml = typeof body?.sectionHtml === "string" ? body.sectionHtml : "";
    const sectionLabel = typeof body?.sectionLabel === "string" ? body.sectionLabel : undefined;
    const styleVariant = typeof body?.styleVariant === "string" ? body.styleVariant : undefined;

    if (!sectionHtml) {
      return NextResponse.json(
        { error: "sectionHtml is required." },
        { status: 400 }
      );
    }

    const userPrompt = buildGenerateUserPrompt(sectionHtml, sectionLabel, styleVariant);
    const { text: raw, error } = await generateWithAI(GENERATE_SYSTEM_PROMPT, userPrompt);

    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes("No AI API key") ? 503 : 500 }
      );
    }

    const code = extractCode(raw);

    if (!code) {
      return NextResponse.json(
        { error: "No component code was generated." },
        { status: 502 }
      );
    }

    return NextResponse.json({ code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
