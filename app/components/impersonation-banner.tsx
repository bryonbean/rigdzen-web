import {
  getSession,
  isImpersonating,
  getEffectiveSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StopImpersonationButton } from "./stop-impersonation-button";

export async function ImpersonationBanner() {
  // Don't show impersonation banner in production
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const impersonating = await isImpersonating();

  if (!impersonating) {
    return null;
  }

  const effectiveSession = await getEffectiveSession();
  if (!effectiveSession) {
    return null;
  }

  const impersonatedUser = await prisma.user.findUnique({
    where: { id: effectiveSession.userId },
    select: { name: true, email: true },
  });

  if (!impersonatedUser) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
      <div className="container mx-auto max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Viewing as: {impersonatedUser.name || impersonatedUser.email}
            </p>
            <p className="text-xs text-yellow-700">
              You are viewing the site as this user. All actions will be
              performed as them.
            </p>
          </div>
        </div>
        <StopImpersonationButton />
      </div>
    </div>
  );
}
