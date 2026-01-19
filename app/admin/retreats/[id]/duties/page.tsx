import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UploadDutiesForm } from "./upload-duties-form";
import { formatDescription } from "@/lib/utils/format-description";
import { AssignDutyForm } from "./assign-duty-form";

export default async function AdminDutiesPage({
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

  // Get retreat and duties with assignments
  const retreat = await prisma.retreat.findUnique({
    where: { id: retreatId },
    include: {
      duties: {
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!retreat) {
    notFound();
  }

  // Get all users for assignment
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  // Calculate duty count per user for this retreat
  const dutyCountsByUser = retreat.duties.reduce(
    (acc, duty) => {
      duty.assignments.forEach((assignment) => {
        acc[assignment.userId] = (acc[assignment.userId] || 0) + 1;
      });
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href={`/admin/retreats/${retreat.id}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Retreat
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Manage Duties - {retreat.name}
          </h1>
          <p className="text-muted-foreground">
            Upload CSV or manually manage retreat duties and assignments
          </p>
        </div>

        {/* CSV Upload Section */}
        <UploadDutiesForm retreatId={retreat.id} />

        {/* Existing Duties */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Duties ({retreat.duties.length})
          </h2>

          {retreat.duties.length === 0 ? (
            <div className="p-6 border border-border rounded-lg bg-card text-center">
              <p className="text-muted-foreground">
                No duties created yet. Upload a CSV or create duties manually.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {retreat.duties.map((duty) => (
                <div
                  key={duty.id}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-2">
                        {duty.title}
                      </h3>
                      {duty.description && (
                        <div className="mb-3 text-muted-foreground">
                          {formatDescription(duty.description)}
                        </div>
                      )}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground">
                            Assign to:
                          </span>
                          <AssignDutyForm
                            retreatId={retreat.id}
                            dutyId={duty.id}
                            assignedUserIds={duty.assignments.map(
                              (a) => a.userId
                            )}
                            users={users}
                            dutyCountsByUser={dutyCountsByUser}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 rounded-full capitalize">
                        {duty.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
