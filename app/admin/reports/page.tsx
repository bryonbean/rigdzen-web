import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";

export default async function ReportsPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            View payment reports and meal selection statistics
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/reports/unpaid-meals"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Unpaid Meals
            </h2>
            <p className="text-muted-foreground">
              View all meal orders that are pending payment
            </p>
          </Link>

          <Link
            href="/admin/reports/user-meal-selections"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              User Meal Selections
            </h2>
            <p className="text-muted-foreground">
              View all meal selections by user across all retreats
            </p>
          </Link>

          <Link
            href="/admin/reports/unacknowledged-duties"
            className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Unacknowledged Duties
            </h2>
            <p className="text-muted-foreground">
              View users who have not acknowledged their assigned duties
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
