import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CopyRetreatForm } from "./copy-retreat-form";

export default async function NewRetreatPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Get all existing retreats for copying
  const existingRetreatsRaw = await prisma.retreat.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });

  // Convert Date objects to ISO strings for client component
  const existingRetreats = existingRetreatsRaw.map((retreat) => ({
    id: retreat.id,
    name: retreat.name,
    startDate: retreat.startDate.toISOString(),
    endDate: retreat.endDate.toISOString(),
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link
            href="/admin/retreats"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Retreats
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create New Retreat
          </h1>
          <p className="text-muted-foreground">
            Add a new retreat to the system
          </p>
        </div>

        <CopyRetreatForm retreats={existingRetreats} />
      </div>
    </main>
  );
}
