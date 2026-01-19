import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminRetreatsPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Get all retreats
  const retreats = await prisma.retreat.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: {
          registrations: true,
          meals: true,
          mealOrders: true,
        },
      },
    },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Manage Retreats
            </h1>
            <p className="text-muted-foreground">
              Create and manage retreats, meals, and duties
            </p>
          </div>
          <Link
            href="/admin/retreats/new"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Create Retreat
          </Link>
        </div>

        {retreats.length === 0 ? (
          <div className="p-8 border border-border rounded-lg bg-card text-center">
            <p className="text-muted-foreground mb-4">
              No retreats created yet.
            </p>
            <Link
              href="/admin/retreats/new"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Create Your First Retreat
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {retreats.map((retreat) => (
              <Link
                key={retreat.id}
                href={`/admin/retreats/${retreat.id}`}
                className="block p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-card-foreground mb-2">
                      {retreat.name}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      <span>
                        {formatDateRange(retreat.startDate, retreat.endDate)}
                      </span>
                      {retreat.location && <span>{retreat.location}</span>}
                      <span className="capitalize">
                        {retreat.status.toLowerCase()}
                      </span>
                    </div>
                    {retreat.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {retreat.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{retreat._count.registrations} participants</span>
                      <span>{retreat._count.meals} meals</span>
                      <span>{retreat._count.mealOrders} orders</span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground ml-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
