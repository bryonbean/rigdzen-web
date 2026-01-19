import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function UnacknowledgedDutiesReportPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Get all unacknowledged duty assignments (status !== "COMPLETED")
  const unacknowledgedAssignments = await prisma.dutyAssignment.findMany({
    where: {
      status: { not: "COMPLETED" },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      duty: {
        include: {
          retreat: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
    },
    orderBy: [
      { duty: { retreat: { startDate: "desc" } } },
      { assignedAt: "asc" },
      { user: { name: "asc" } },
    ],
  });

  // Group assignments by user
  const assignmentsByUser = unacknowledgedAssignments.reduce(
    (acc, assignment) => {
      const userId = assignment.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: assignment.user,
          assignments: [],
        };
      }
      acc[userId].assignments.push(assignment);
      return acc;
    },
    {} as Record<
      number,
      {
        user: (typeof unacknowledgedAssignments)[0]["user"];
        assignments: typeof unacknowledgedAssignments;
      }
    >
  );

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
        <div>
          <Link
            href="/admin/reports"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Unacknowledged Duties Report
          </h1>
          <p className="text-muted-foreground">
            Users who have been assigned duties but have not yet acknowledged
            them
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground">
                {Object.keys(assignmentsByUser).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Unacknowledged
              </p>
              <p className="text-2xl font-bold text-foreground">
                {unacknowledgedAssignments.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retreats Affected</p>
              <p className="text-2xl font-bold text-foreground">
                {
                  new Set(
                    unacknowledgedAssignments.map((a) => a.duty.retreat.id)
                  ).size
                }
              </p>
            </div>
          </div>
        </div>

        {/* User List */}
        {Object.keys(assignmentsByUser).length === 0 ? (
          <div className="p-6 border border-border rounded-lg bg-card text-center">
            <p className="text-muted-foreground">
              All assigned duties have been acknowledged! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(assignmentsByUser).map((userData) => (
              <div
                key={userData.user.id}
                className="border border-border rounded-lg bg-card overflow-hidden"
              >
                {/* User Header */}
                <div className="p-4 bg-muted border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {userData.user.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {userData.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {userData.assignments.length} unacknowledged
                        {userData.assignments.length !== 1
                          ? " duties"
                          : " duty"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duties Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                          Retreat
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                          Duty Title
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                          Assigned
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {userData.assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/retreats/${assignment.duty.retreat.id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {assignment.duty.retreat.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(assignment.duty.retreat.startDate)} -{" "}
                              {formatDate(assignment.duty.retreat.endDate)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">
                              {assignment.duty.title}
                            </p>
                            <Link
                              href={`/admin/retreats/${assignment.duty.retreat.id}/duties`}
                              className="text-sm text-primary hover:underline"
                            >
                              View duty details →
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(assignment.assignedAt)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/retreats/${assignment.duty.retreat.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              View retreat →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
