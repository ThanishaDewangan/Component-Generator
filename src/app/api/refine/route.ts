import { NextResponse } from "next/server";
import { generateWithAI } from "@/lib/ai";
import { REFINE_SYSTEM_PROMPT, buildRefineUserPrompt } from "@/lib/prompts";

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
    const currentCode = typeof body?.currentCode === "string" ? body.currentCode : "";
    const userMessage = typeof body?.userMessage === "string" ? body.userMessage.trim() : "";

    if (!currentCode) {
      return NextResponse.json(
        { error: "currentCode is required." },
        { status: 400 }
      );
    }
    if (!userMessage) {
      return NextResponse.json(
        { error: "userMessage is required." },
        { status: 400 }
      );
    }

    const userPrompt = buildRefineUserPrompt(currentCode, userMessage);
    const { text: raw, error } = await generateWithAI(REFINE_SYSTEM_PROMPT, userPrompt);

    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes("No AI API key") ? 503 : 500 }
      );
    }

    const code = extractCode(raw);

    if (!code) {
      return NextResponse.json(
        { error: "No refined code was generated." },
        { status: 502 }
      );
    }

    return NextResponse.json({ code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refinement failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
