import { redirect } from "next/navigation";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getActiveParticipantCounts } from "@/lib/utils/retreat-participants";
import Link from "next/link";

export default async function RetreatsPage() {
  const session = await getEffectiveSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Get all retreats (for now, all retreats - later filter by user registration)
  const retreats = await prisma.retreat.findMany({
    orderBy: { startDate: "asc" },
  });

  // Get user registrations to show status
  const userRegistrations = await prisma.retreatRegistration.findMany({
    where: { userId: session.userId },
    select: { retreatId: true, status: true },
  });
  const registrationMap = new Map(
    userRegistrations.map((r) => [r.retreatId, r.status])
  );

  // Get active participant counts for all retreats (excluding CANCELLED)
  const retreatIds = retreats.map((r) => r.id);
  const participantCountMap = await getActiveParticipantCounts(retreatIds);

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
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Retreats</h1>
          <p className="text-muted-foreground">
            View and manage your retreat registrations, meal orders, and duties
          </p>
        </div>

        {retreats.length === 0 ? (
          <div className="p-8 border border-border rounded-lg bg-card text-center">
            <p className="text-muted-foreground">
              No retreats scheduled at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {retreats.map((retreat) => {
              const registrationStatus = registrationMap.get(retreat.id);
              const isAttending =
                !!registrationStatus && registrationStatus !== "CANCELLED";

              return (
                <Link
                  key={retreat.id}
                  href={`/retreats/${retreat.id}`}
                  className="p-6 border border-border rounded-lg bg-card hover:bg-accent transition-colors block"
                >
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-semibold text-card-foreground mb-1">
                        {retreat.name}
                      </h2>
                      {retreat.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {retreat.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {formatDateRange(retreat.startDate, retreat.endDate)}
                        </span>
                      </div>

                      {retreat.location && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{retreat.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <span>
                          {participantCountMap.get(retreat.id) || 0}{" "}
                          participants
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      {isAttending ? (
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {registrationStatus === "CONFIRMED"
                            ? "Confirmed"
                            : "Attending"}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                          Not attending
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
