import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserSelector } from "./impersonate/user-selector";

export default async function AdminPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Get all users for impersonation selector
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage retreats, meals, duties, and participants
          </p>
        </div>

        {/* View As User - Only in development */}
        {process.env.NODE_ENV !== "production" && (
          <UserSelector users={users} />
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/retreats"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Manage Retreats
            </h2>
            <p className="text-muted-foreground">
              Create and manage retreats, add meals, and assign duties
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Manage Users
            </h2>
            <p className="text-muted-foreground">
              View and manage user accounts
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Reports & Analytics
            </h2>
            <p className="text-muted-foreground">
              View payment reports and meal selection statistics
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
