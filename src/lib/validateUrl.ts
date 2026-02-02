/**
 * Validates that a URL is public and safe to scrape.
 * Rejects localhost (in production), file:, and non-http(s) URLs.
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Only http and https URLs are allowed." };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      return { valid: false, error: "Local and private URLs are not allowed." };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Please enter a valid URL." };
  }
}
