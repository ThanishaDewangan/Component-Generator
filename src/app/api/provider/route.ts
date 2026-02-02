import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";

/**
 * GET /api/provider — returns which AI provider is active (for UI display).
 * Does not expose keys.
 */
export async function GET() {
  const { provider, error } = getAIProvider();
  return NextResponse.json({
    provider: error ? null : provider,
    error: error ?? null,
  });
}
