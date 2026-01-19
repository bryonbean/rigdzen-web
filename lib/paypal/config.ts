import "server-only";

const ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || "sandbox";

const BASE_URL =
  ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

/**
 * Get PayPal credentials, throwing error only when actually needed (runtime)
 */
function getPayPalCredentials(): { clientId: string; clientSecret: string } {
  const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env"
    );
  }

  return { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET };
}

/**
 * Get PayPal access token using client credentials
 */
async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Make authenticated request to PayPal API
 */
export async function paypalRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken();

  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
