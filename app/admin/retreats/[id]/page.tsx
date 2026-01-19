import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getActiveParticipantCount } from "@/lib/utils/retreat-participants";
import Link from "next/link";

export default async function AdminRetreatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  const retreatId = parseInt(params.id);
  if (isNaN(retreatId)) {
    notFound();
  }

  // Get retreat details
  const retreat = await prisma.retreat.findUnique({
    where: { id: retreatId },
    include: {
      meals: {
        orderBy: { mealDate: "asc" },
      },
      duties: {
        include: {
          assignments: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      registrations: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          registrations: true,
          meals: true,
          mealOrders: true,
        },
      },
    },
  });

  if (!retreat) {
    notFound();
  }

  // Get count of active (non-cancelled) participants
  const activeParticipantCount = await getActiveParticipantCount(retreatId);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/admin/retreats"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Retreats
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {retreat.name}
          </h1>
          <div className="flex gap-4 text-sm text-muted-foreground mb-4">
            <span>
              {formatDate(retreat.startDate)} - {formatDate(retreat.endDate)}
            </span>
            {retreat.location && <span>{retreat.location}</span>}
            <span className="capitalize">{retreat.status.toLowerCase()}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border border-border rounded-lg bg-card">
            <div className="text-2xl font-bold text-card-foreground">
              {activeParticipantCount}
            </div>
            <div className="text-sm text-muted-foreground">Participants</div>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <div className="text-2xl font-bold text-card-foreground">
              {retreat._count.meals}
            </div>
            <div className="text-sm text-muted-foreground">Meals</div>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <div className="text-2xl font-bold text-card-foreground">
              {retreat._count.mealOrders}
            </div>
            <div className="text-sm text-muted-foreground">Meal Orders</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/admin/retreats/${retreat.id}/meals`}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Manage Meals
          </Link>
          <Link
            href={`/admin/retreats/${retreat.id}/duties`}
            className="px-6 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors font-medium"
          >
            Manage Duties
          </Link>
          <Link
            href={`/retreats/${retreat.id}`}
            className="px-6 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors font-medium"
          >
            View as User
          </Link>
        </div>

        {/* Meals Preview */}
        <section className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              Meals ({retreat.meals.length})
            </h2>
            <Link
              href={`/admin/retreats/${retreat.id}/meals`}
              className="text-sm text-primary hover:underline"
            >
              Manage →
            </Link>
          </div>

          {retreat.meals.length === 0 ? (
            <p className="text-muted-foreground">No meals added yet.</p>
          ) : (
            <div className="space-y-2">
              {retreat.meals.slice(0, 3).map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3 border border-border rounded bg-background"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {meal.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(meal.mealDate)} - ${meal.price.toFixed(2)}{" "}
                      CAD
                    </div>
                  </div>
                  {meal.available ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
              ))}
              {retreat.meals.length > 3 && (
                <p className="text-sm text-muted-foreground pt-2">
                  +{retreat.meals.length - 3} more meals
                </p>
              )}
            </div>
          )}
        </section>

        {/* Duties Preview */}
        <section className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              Duties ({retreat.duties.length})
            </h2>
            <Link
              href={`/admin/retreats/${retreat.id}/duties`}
              className="text-sm text-primary hover:underline"
            >
              Manage →
            </Link>
          </div>

          {retreat.duties.length === 0 ? (
            <p className="text-muted-foreground">No duties assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {retreat.duties.slice(0, 3).map((duty) => (
                <div
                  key={duty.id}
                  className="flex items-center justify-between p-3 border border-border rounded bg-background"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {duty.title}
                    </div>
                    {duty.assignments.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Assigned to:{" "}
                        {duty.assignments
                          .map((a) => a.user.name || a.user.email)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 rounded-full capitalize">
                    {duty.status.toLowerCase()}
                  </span>
                </div>
              ))}
              {retreat.duties.length > 3 && (
                <p className="text-sm text-muted-foreground pt-2">
                  +{retreat.duties.length - 3} more duties
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
