/**
 * Get the base URL for the application
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicitly set)
 * 2. VERCEL_URL (automatically provided by Vercel)
 * 3. Request headers (for dynamic detection)
 * 4. localhost (development fallback)
 */
export function getBaseUrl(request?: Request): string {
  // Explicitly configured URL (highest priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel automatically provides VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Try to get from request headers (for dynamic detection)
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // Development fallback
  return process.env.NODE_ENV === "production"
    ? "https://orgyenrigdzen.dev" // Production fallback
    : "http://localhost:3000";
}
