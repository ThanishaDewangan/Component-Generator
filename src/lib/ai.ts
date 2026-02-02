/**
 * AI provider abstraction: Groq (free), Claude (Anthropic), or Gemini (Google).
 * Use Groq for free tier (no credit card) at https://console.groq.com
 */

export type AIProvider = "groq" | "anthropic" | "google";

export function getAIProvider(): { provider: AIProvider; error?: string } {
  const groqKey = process.env.GROQ_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Prefer Groq (free, no credit card), then Claude, then Gemini
  if (groqKey) return { provider: "groq" };
  if (anthropicKey) return { provider: "anthropic" };
  if (googleKey) return { provider: "google" };

  return {
    provider: "groq",
    error:
      "No AI API key found. Add GROQ_API_KEY (free, no credit card at https://console.groq.com) or GOOGLE_GENERATIVE_AI_API_KEY or ANTHROPIC_API_KEY to .env.local.",
  };
}

export async function generateWithAI(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; error?: string }> {
  const { provider, error } = getAIProvider();
  if (error) return { text: "", error };

  if (provider === "groq") {
    return generateWithGroq(systemPrompt, userPrompt);
  }
  if (provider === "google") {
    return generateWithGemini(systemPrompt, userPrompt);
  }
  return generateWithClaude(systemPrompt, userPrompt);
}

async function generateWithGroq(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; error?: string }> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { text: "", error: "GROQ_API_KEY not set." };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8192,
      }),
    });

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg = data?.error?.message ?? `Groq request failed: ${res.status}`;
      return { text: "", error: msg };
    }

    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Groq request failed.";
    return { text: "", error: message };
  }
}

async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; error?: string }> {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return { text: "", error: "GOOGLE_GENERATIVE_AI_API_KEY not set." };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      contents: userPrompt,
    });

    const raw = response as { text?: string | (() => string) };
    const text =
      typeof raw.text === "function" ? raw.text() : (raw.text ?? "");
    return { text: text.trim() };
  } catch (err) {
    const status = (err as { status?: number; statusCode?: number }).status
      ?? (err as { status?: number; statusCode?: number }).statusCode;
    const message = err instanceof Error ? err.message : String(err);
    const isQuota = status === 429
      || message.includes("429")
      || message.includes("RESOURCE_EXHAUSTED")
      || message.includes("quota");

    if (isQuota) {
      return {
        text: "",
        error:
          "Gemini rate limit or quota exceeded. Wait a minute and try again, or check your free-tier limits at https://ai.google.dev/gemini-api/docs/rate-limits. If you have Claude credits, add ANTHROPIC_API_KEY to .env.local to use Claude instead.",
      };
    }
    return { text: "", error: message || "Gemini request failed." };
  }
}

async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; error?: string }> {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { text: "", error: "ANTHROPIC_API_KEY not set." };

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    return { text: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude request failed.";
    return { text: "", error: message };
  }
}
