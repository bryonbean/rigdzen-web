/**
 * Get the base URL for the application
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicitly set - recommended for production)
 * 2. Request headers (for dynamic detection - works for custom domains)
 * 3. VERCEL_URL (only for preview deployments, not production)
 * 4. localhost (development fallback)
 */
export function getBaseUrl(request?: Request): string {
  // Explicitly configured URL (highest priority - should be set in Vercel)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Try to get from request headers first (works for custom domains)
  // This is important because VERCEL_URL might be a preview URL
  if (request) {
    const url = new URL(request.url);
    const host = url.host;

    // If it's the custom domain, use it
    if (host === "orgyenrigdzen.dev" || host.endsWith(".orgyenrigdzen.dev")) {
      return `${url.protocol}//${host}`;
    }

    // For other cases, still use the request URL
    return `${url.protocol}//${host}`;
  }

  // Vercel automatically provides VERCEL_URL (use only if no request available)
  // Note: This will be a preview URL for preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development fallback
  return process.env.NODE_ENV === "production"
    ? "https://orgyenrigdzen.dev" // Production fallback
    : "http://localhost:3000";
}
