import { redirect } from "next/navigation";
import Link from "next/link";
import { getEffectiveSession, getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getEffectiveSession();
  // Check actual admin status for showing admin link
  const adminSession = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Get user data for display
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || session.email}!
          </p>
          {adminSession?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-block mt-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Dashboard cards will go here */}
          <a
            href="/retreats"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Retreats
            </h2>
            <p className="text-muted-foreground">View and manage retreats</p>
          </a>

          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Practice Tracking
            </h2>
            <p className="text-muted-foreground">
              Track your practice accumulations
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Calendar
            </h2>
            <p className="text-muted-foreground">View retreat calendar</p>
          </div>
        </div>

        {/* Session Info (for testing - remove in production) */}
        <div className="mt-8 p-4 border border-border rounded-lg bg-muted">
          <h3 className="font-semibold text-foreground mb-2">Session Info</h3>
          <pre className="text-sm text-muted-foreground overflow-auto">
            {JSON.stringify(
              {
                userId: session.userId,
                email: session.email,
                role: session.role,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </main>
  );
}
