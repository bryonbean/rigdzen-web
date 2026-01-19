import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: { error?: string; email?: string };
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();

  // Redirect authenticated users to dashboard or profile completion
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (user?.profileCompleted) {
      redirect("/dashboard");
    } else {
      redirect("/profile/complete");
    }
  }

  const error = searchParams.error;
  const email = searchParams.email;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.jpg" alt="Rigdzen" className="h-64 w-auto" />
          </div>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4">
          <h2 className="text-center text-lg font-semibold text-foreground">
            Sign in to continue
          </h2>

          {/* Error Message */}
          {error === "user_not_found" && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-600 font-medium mb-1">
                Access Denied
              </p>
              <p className="text-sm text-red-600/80">
                {email
                  ? `The email address ${email} is not authorized to access this application. Please contact an administrator.`
                  : "Your email address is not authorized to access this application. Please contact an administrator."}
              </p>
            </div>
          )}

          {error === "oauth_error" && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-sm text-yellow-600 font-medium mb-1">
                Authentication Error
              </p>
              <p className="text-sm text-yellow-600/80">
                There was an error during authentication. Please try again.
              </p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-input bg-background text-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Sign in with Google"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-medium">Sign in with Google</span>
            </a>

            {/* Apple OAuth Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-input bg-background text-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Sign in with Apple"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="font-medium">Sign in with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Magic Link Option */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-input bg-background text-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm"
            aria-label="Sign in with email"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">Sign in with email</span>
          </button>
        </div>
      </div>
    </main>
  );
}
