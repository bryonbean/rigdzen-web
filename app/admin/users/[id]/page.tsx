import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EditUserForm } from "./edit-user-form";
import { MarkPaidCashButton } from "./mark-paid-cash-button";

export default async function AdminUserDetailPage({
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

  const userId = parseInt(params.id);
  if (isNaN(userId)) {
    notFound();
  }

  // Get user with related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      mealOrders: {
        include: {
          meal: {
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
          menuItems: {
            include: {
              menuItem: true,
            },
          },
          payment: {
            select: {
              status: true,
              amount: true,
              completedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      retreatRegistrations: {
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
        orderBy: { registeredAt: "desc" },
      },
      dutyAssignments: {
        include: {
          duty: {
            include: {
              retreat: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 10, // Show last 10 assignments
      },
      _count: {
        select: {
          mealOrders: true,
          retreatRegistrations: true,
          dutyAssignments: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

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

  // Calculate total paid amount
  const totalPaid = user.mealOrders
    .filter((order) => order.payment?.status === "COMPLETED")
    .reduce((sum, order) => sum + (order.payment?.amount || 0), 0);

  // Separate paid and unpaid orders
  const paidOrders = user.mealOrders.filter((order) => order.status === "PAID");
  const unpaidOrders = user.mealOrders.filter(
    (order) => order.status === "PENDING"
  );

  // Calculate order amount helper
  const calculateOrderAmount = (order: (typeof user.mealOrders)[0]) => {
    if (order.payment?.status === "COMPLETED" && order.payment.amount) {
      return order.payment.amount;
    }
    const quantities = order.menuItems
      .map((item) => item.quantity)
      .filter((q): q is number => q !== null);
    const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
    return order.meal.price * maxQuantity;
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href="/admin/users"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            User Details
          </h1>
        </div>

        {/* User Info Card */}
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {user.name || "Unknown"}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  user.role === "ADMIN"
                    ? "bg-purple-500/10 text-purple-600"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                {user.role}
              </span>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  user.profileCompleted
                    ? "bg-green-500/10 text-green-600"
                    : "bg-yellow-500/10 text-yellow-600"
                }`}
              >
                {user.profileCompleted
                  ? "Profile Complete"
                  : "Profile Incomplete"}
              </span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Meal Orders</p>
              <p className="text-xl font-bold text-foreground">
                {user._count.mealOrders}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retreats</p>
              <p className="text-xl font-bold text-foreground">
                {user._count.retreatRegistrations}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duties</p>
              <p className="text-xl font-bold text-foreground">
                {user._count.dutyAssignments}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-foreground">
                ${totalPaid.toFixed(2)} CAD
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <EditUserForm user={user} />
        </div>

        {/* Unpaid Meal Orders */}
        {unpaidOrders.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Unpaid Meal Orders ({unpaidOrders.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Retreat
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Meal
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Ordered
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unpaidOrders.map((order) => {
                    const amount = calculateOrderAmount(order);
                    return (
                      <tr key={order.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <Link
                            href={`/admin/retreats/${order.meal.retreat.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            {order.meal.retreat.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-sm text-foreground">
                          {order.meal.name}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-foreground">
                          ${amount.toFixed(2)} CAD
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <MarkPaidCashButton
                            mealOrderId={order.id}
                            amount={amount}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Paid Meal Orders */}
        {paidOrders.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Paid Meal Orders ({paidOrders.length} of {user._count.mealOrders}{" "}
              total)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Retreat
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Meal
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Payment Method
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paidOrders.map((order) => {
                    const amount = calculateOrderAmount(order);
                    return (
                      <tr key={order.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <Link
                            href={`/admin/retreats/${order.meal.retreat.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            {order.meal.retreat.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-sm text-foreground">
                          {order.meal.name}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-foreground">
                          ${amount.toFixed(2)} CAD
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              order.paymentMethod === "CASH"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-purple-500/10 text-purple-600"
                            }`}
                          >
                            {order.paymentMethod || "PAYPAL"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {order.payment?.completedAt
                            ? formatDateTime(order.payment.completedAt)
                            : formatDateTime(order.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Retreat Registrations */}
        {user.retreatRegistrations.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Retreat Registrations ({user._count.retreatRegistrations} total)
            </h3>
            <div className="space-y-2">
              {user.retreatRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <Link
                      href={`/admin/retreats/${registration.retreat.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {registration.retreat.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(registration.retreat.startDate)} -{" "}
                      {formatDate(registration.retreat.endDate)}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 rounded-full capitalize">
                    {registration.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duty Assignments */}
        {user.dutyAssignments.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Duty Assignments ({user._count.dutyAssignments} total)
            </h3>
            <div className="space-y-2">
              {user.dutyAssignments.map(
                (assignment: (typeof user.dutyAssignments)[0]) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/admin/retreats/${assignment.duty.retreat.id}/duties`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {assignment.duty.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {assignment.duty.retreat.name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.status === "COMPLETED"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                )
              )}
            </div>
            {user._count.dutyAssignments > 10 && (
              <p className="text-sm text-muted-foreground mt-4">
                Showing last 10 of {user._count.dutyAssignments} assignments
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
