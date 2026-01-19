import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminUsersPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Get all users with counts
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          mealOrders: true,
          retreatRegistrations: true,
          dutyAssignments: true,
        },
      },
    },
  });

  // Calculate statistics
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;
  const participantUsers = users.filter((u) => u.role === "PARTICIPANT").length;
  const profileCompleted = users.filter((u) => u.profileCompleted).length;

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
            Manage Users
          </h1>
          <p className="text-muted-foreground">View and manage user accounts</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold text-foreground">{adminUsers}</p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="text-2xl font-bold text-foreground">
              {participantUsers}
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Profiles Completed</p>
            <p className="text-2xl font-bold text-foreground">
              {profileCompleted}
            </p>
          </div>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="p-8 border border-border rounded-lg bg-card text-center">
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Profile
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Meal Orders
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Retreats
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Duties
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {user.name || "Unknown"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-600"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            user.profileCompleted
                              ? "bg-green-500/10 text-green-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {user.profileCompleted ? "Complete" : "Incomplete"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">
                          {user._count.mealOrders}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">
                          {user._count.retreatRegistrations}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">
                          {user._count.dutyAssignments}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(user.createdAt))}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
