import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { getBaseUrl } from "@/lib/utils/get-base-url";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error || !code) {
      return NextResponse.redirect(`${baseUrl}?error=oauth_error`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      );
    }

    // Exchange authorization code for tokens
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      return NextResponse.json(
        { error: "No ID token received" },
        { status: 400 }
      );
    }

    // Verify and extract user info from ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json({ error: "Invalid ID token" }, { status: 400 });
    }

    const email = payload.email;
    const name = payload.name || null;
    const googleId = payload.sub;

    if (!email || !googleId) {
      return NextResponse.json(
        { error: "Missing user information from Google" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });

    // Check if OAuth account exists
    const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: "GOOGLE",
          providerId: googleId,
        },
      },
    });

    if (existingOAuthAccount && user) {
      // OAuth account exists and is linked - user is logging in
      // Create session
      await createSession(user.id, user.email, user.role);
      // Redirect to dashboard or profile completion
      const redirectUrl = user.profileCompleted
        ? "/dashboard"
        : "/profile/complete";
      return NextResponse.redirect(`${baseUrl}${redirectUrl}`);
    }

    if (user && !existingOAuthAccount) {
      // User exists but OAuth account not linked - link it
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: "GOOGLE",
          providerId: googleId,
        },
      });
      // Create session
      await createSession(user.id, user.email, user.role);
      // Redirect to dashboard or profile completion
      const redirectUrl = user.profileCompleted
        ? "/dashboard"
        : "/profile/complete";
      return NextResponse.redirect(`${baseUrl}${redirectUrl}`);
    }

    if (!user) {
      // User not found in database - deny access
      return NextResponse.redirect(
        `${baseUrl}?error=user_not_found&email=${encodeURIComponent(email)}`
      );
    }

    // Fallback redirect (should not reach here)
    await createSession(user.id, user.email, user.role);
    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${baseUrl}?error=oauth_error`);
  }
}
