import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY =
  process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production";
const SESSION_DURATION_DAYS = 7;
const SESSION_COOKIE_NAME = "rigdzen-session";
const IMPERSONATION_COOKIE_NAME = "rigdzen-impersonate";

interface SessionData {
  userId: number;
  email: string;
  role: string;
  expiresAt: number;
}

export async function createSession(
  userId: number,
  email: string,
  role: string
): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const sessionData: SessionData = {
    userId,
    email,
    role,
    expiresAt,
  };

  const secret = new TextEncoder().encode(SECRET_KEY);
  const token = await new SignJWT({
    userId: sessionData.userId,
    email: sessionData.email,
    role: sessionData.role,
    expiresAt: sessionData.expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from "strict" to allow OAuth callback redirects
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);

    const sessionData = payload as unknown as SessionData;

    // Check if session is expired
    if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
      // Don't delete cookie here - just return null
      // Cookie will expire naturally or be deleted in Route Handler
      return null;
    }

    return sessionData;
  } catch (error) {
    // Invalid token or verification failed
    // Don't delete cookie here - just return null
    // Cookie will expire naturally or be deleted in Route Handler
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function refreshSession(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  // Refresh session if less than 1 day remaining
  const daysRemaining =
    (session.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
  if (daysRemaining < 1) {
    await createSession(session.userId, session.email, session.role);
    const refreshedSession = await getSession();
    return refreshedSession;
  }

  return session;
}

/**
 * Get the effective session, checking for impersonation.
 * If an admin is impersonating a user, returns the impersonated user's session.
 * Otherwise returns the normal session.
 */
export async function getEffectiveSession(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  // Disable impersonation in production
  if (process.env.NODE_ENV !== "development") {
    return session;
  }

  // Check if impersonation is active (development only)
  const cookieStore = await cookies();
  const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

  if (impersonationCookie && session.role === "ADMIN") {
    try {
      const secret = new TextEncoder().encode(SECRET_KEY);
      const { payload } = await jwtVerify(impersonationCookie, secret);
      const impersonatedData = payload as {
        userId: number;
        email: string;
        role: string;
      };

      // Return impersonated user's session data, but keep admin's original role for authorization checks
      return {
        userId: impersonatedData.userId,
        email: impersonatedData.email,
        role: impersonatedData.role, // Use impersonated user's role for UI/data access
        expiresAt: session.expiresAt, // Use original session expiration
      };
    } catch (error) {
      // Invalid impersonation cookie - clear it and return normal session
      cookieStore.delete(IMPERSONATION_COOKIE_NAME);
      return session;
    }
  }

  return session;
}

/**
 * Get the original admin session (for authorization checks).
 * Returns the actual logged-in admin's session, even if impersonating.
 */
export async function getAdminSession(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return null;
  }
  return session;
}

/**
 * Start impersonating a user (admin only).
 */
export async function startImpersonation(
  impersonatedUserId: number,
  impersonatedEmail: string,
  impersonatedRole: string
): Promise<void> {
  // Disable impersonation in production
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Impersonation is only available in development");
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Only admins can impersonate users");
  }

  const secret = new TextEncoder().encode(SECRET_KEY);
  const token = await new SignJWT({
    userId: impersonatedUserId,
    email: impersonatedEmail,
    role: impersonatedRole,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(
        (Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000) / 1000
      )
    )
    .sign(secret);

  const cookieStore = await cookies();
  const nodeEnv = process.env.NODE_ENV as string | undefined;
  cookieStore.set(IMPERSONATION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Stop impersonating and return to admin view.
 */
export async function stopImpersonation(): Promise<void> {
  // Disable impersonation in production
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE_NAME);
}

/**
 * Check if impersonation is currently active.
 */
export async function isImpersonating(): Promise<boolean> {
  // Disable impersonation in production
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return false;
  }

  const cookieStore = await cookies();
  const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;
  return !!impersonationCookie;
}
