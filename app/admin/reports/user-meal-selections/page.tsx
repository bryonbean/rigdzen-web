import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RetreatFilter } from "./retreat-filter";

interface PageProps {
  searchParams: { retreatId?: string; view?: "users" | "meals" };
}

export default async function UserMealSelectionsReportPage({
  searchParams,
}: PageProps) {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  const retreatId = searchParams.retreatId
    ? parseInt(searchParams.retreatId)
    : null;
  const view = searchParams.view || "users"; // "users" or "meals"

  // Get all retreats for the filter dropdown
  const allRetreats = await prisma.retreat.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });

  // Build query for meal orders
  const orderWhere = retreatId
    ? { meal: { retreatId }, status: { in: ["PENDING", "PAID"] } }
    : { status: { in: ["PENDING", "PAID"] } };

  // Get meal orders
  const allOrders = await prisma.mealOrder.findMany({
    where: orderWhere,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
          menuItems: {
            select: {
              id: true,
              name: true,
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
        },
      },
    },
    orderBy: [
      { meal: { retreat: { startDate: "desc" } } },
      { meal: { mealDate: "asc" } },
      { user: { name: "asc" } },
    ],
  });

  // Get retreat registrations for all users who have orders
  const userIds = [...new Set(allOrders.map((order) => order.userId))];
  const retreatRegistrations = await prisma.retreatRegistration.findMany({
    where: {
      userId: { in: userIds },
      status: "CANCELLED", // Only get cancelled registrations
    },
    select: {
      userId: true,
      retreatId: true,
      status: true,
    },
  });

  // Create a map of user-retreat pairs that are cancelled
  const cancelledRegistrationsMap = new Map<string, boolean>();
  retreatRegistrations.forEach((reg) => {
    cancelledRegistrationsMap.set(`${reg.userId}-${reg.retreatId}`, true);
  });

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

  // Group orders by user (for user view)
  const ordersByUser = allOrders.reduce(
    (acc, order) => {
      const userId = order.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: order.user,
          orders: [],
          totalPaid: 0,
          totalUnpaid: 0,
          hasIssue: false, // Flag for paid meals but declined attendance
        };
      }
      acc[userId].orders.push(order);

      // Calculate amounts
      const quantities = order.menuItems
        .map((item) => item.quantity)
        .filter((q): q is number => q !== null);
      const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
      const amount = order.meal.price * maxQuantity;

      // Check if user has paid for this meal but declined attendance
      const isPaid = order.payment && order.payment.status === "COMPLETED";
      const hasDeclinedAttendance = cancelledRegistrationsMap.has(
        `${userId}-${order.meal.retreat.id}`
      );

      if (isPaid && hasDeclinedAttendance) {
        acc[userId].hasIssue = true;
      }

      if (isPaid && order.payment) {
        acc[userId].totalPaid += order.payment.amount || amount;
      } else {
        acc[userId].totalUnpaid += amount;
      }

      return acc;
    },
    {} as Record<
      number,
      {
        user: (typeof allOrders)[0]["user"];
        orders: typeof allOrders;
        totalPaid: number;
        totalUnpaid: number;
        hasIssue: boolean;
      }
    >
  );

  // Group orders by meal and aggregate menu item counts (for meals view)
  const ordersByMeal = allOrders.reduce(
    (acc, order) => {
      const mealId = order.mealId;
      if (!acc[mealId]) {
        acc[mealId] = {
          meal: order.meal,
          menuItemCounts: {} as Record<number, number>,
          totalOrders: 0,
          totalUsers: new Set<number>(),
        };
      }

      acc[mealId].totalOrders += 1;
      acc[mealId].totalUsers.add(order.userId);

      // Count menu items
      order.menuItems.forEach((orderMenuItem) => {
        const menuItemId = orderMenuItem.menuItemId;
        const quantity = orderMenuItem.quantity || 1;
        acc[mealId].menuItemCounts[menuItemId] =
          (acc[mealId].menuItemCounts[menuItemId] || 0) + quantity;
      });

      return acc;
    },
    {} as Record<
      number,
      {
        meal: (typeof allOrders)[0]["meal"];
        menuItemCounts: Record<number, number>;
        totalOrders: number;
        totalUsers: Set<number>;
      }
    >
  );

  const selectedRetreat = retreatId
    ? allRetreats.find((r) => r.id === retreatId)
    : null;

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
            User Meal Selections Report
          </h1>
          <p className="text-muted-foreground">
            {selectedRetreat
              ? `Meal selections for ${selectedRetreat.name}`
              : "All meal selections organized by user or meal"}
          </p>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-card">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="text-sm font-medium text-foreground">
              Filter by Retreat:
            </label>
            <Suspense fallback={<div className="px-3 py-2">Loading...</div>}>
              <RetreatFilter
                retreats={allRetreats}
                currentRetreatId={retreatId}
              />
            </Suspense>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/reports/user-meal-selections?retreatId=${retreatId || ""}&view=users`}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === "users"
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background text-foreground hover:bg-accent"
              }`}
            >
              By User
            </Link>
            <Link
              href={`/admin/reports/user-meal-selections?retreatId=${retreatId || ""}&view=meals`}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === "meals"
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background text-foreground hover:bg-accent"
              }`}
            >
              By Meal
            </Link>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {view === "users" ? "Total Users" : "Total Meals"}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {view === "users"
                  ? Object.keys(ordersByUser).length
                  : Object.keys(ordersByMeal).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">
                {allOrders.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-foreground">
                $
                {Object.values(ordersByUser)
                  .reduce((sum, userData) => sum + userData.totalPaid, 0)
                  .toFixed(2)}{" "}
                CAD
              </p>
            </div>
          </div>
        </div>

        {/* User View */}
        {view === "users" && (
          <>
            {Object.keys(ordersByUser).length === 0 ? (
              <div className="p-6 border border-border rounded-lg bg-card text-center">
                <p className="text-muted-foreground">No meal orders found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(ordersByUser).map((userData) => (
                  <div
                    key={userData.user.id}
                    className={`border rounded-lg bg-card overflow-hidden ${
                      userData.hasIssue
                        ? "border-red-500 border-2 bg-red-50/5"
                        : "border-border"
                    }`}
                  >
                    {/* User Header */}
                    <div
                      className={`p-4 border-b ${
                        userData.hasIssue
                          ? "bg-red-500/10 border-red-500/20"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {userData.user.name || "Unknown"}
                            </h3>
                            {userData.hasIssue && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                Issue: Paid but Declined Attendance
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {userData.user.email}
                          </p>
                          {userData.hasIssue && (
                            <p className="text-sm text-red-600 mt-1 font-medium">
                              ⚠️ This user has paid for meals but declined
                              attendance for the retreat
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {userData.orders.length} order
                            {userData.orders.length !== 1 ? "s" : ""}
                          </p>
                          <div className="mt-1 space-x-4">
                            <span className="text-sm font-medium text-green-600">
                              Paid: ${userData.totalPaid.toFixed(2)} CAD
                            </span>
                            {userData.totalUnpaid > 0 && (
                              <span className="text-sm font-medium text-yellow-600">
                                Unpaid: ${userData.totalUnpaid.toFixed(2)} CAD
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Retreat
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Meal
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Menu Items
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Cash
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Ordered
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {userData.orders.map((order) => {
                            const quantities = order.menuItems
                              .map((item) => item.quantity)
                              .filter((q): q is number => q !== null);
                            const maxQuantity =
                              quantities.length > 0
                                ? Math.max(...quantities)
                                : 1;
                            const amount = order.meal.price * maxQuantity;
                            const isPaid =
                              order.payment?.status === "COMPLETED";
                            const displayAmount =
                              order.payment?.status === "COMPLETED"
                                ? order.payment.amount || amount
                                : amount;

                            return (
                              <tr key={order.id} className="hover:bg-muted/50">
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/admin/retreats/${order.meal.retreat.id}`}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {order.meal.retreat.name}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(order.meal.retreat.startDate)} -{" "}
                                    {formatDate(order.meal.retreat.endDate)}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-foreground">
                                    {order.meal.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDateTime(order.meal.mealDate)}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    {order.menuItems.map((item) => (
                                      <p
                                        key={item.id}
                                        className="text-sm text-foreground"
                                      >
                                        {item.menuItem.name}
                                        {item.quantity !== null && (
                                          <span className="text-muted-foreground">
                                            {" "}
                                            (×{item.quantity})
                                          </span>
                                        )}
                                      </p>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-foreground">
                                    ${displayAmount.toFixed(2)} CAD
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                      isPaid
                                        ? "bg-green-500/10 text-green-600"
                                        : "bg-yellow-500/10 text-yellow-600"
                                    }`}
                                  >
                                    {isPaid ? "Paid" : "Pending"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-foreground">
                                    {!isPaid
                                      ? "N/A"
                                      : order.paymentMethod === "CASH"
                                        ? "Yes"
                                        : "No"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-muted-foreground">
                                    {formatDateTime(order.createdAt)}
                                  </p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Meals View - Aggregated by Meal */}
        {view === "meals" && (
          <>
            {Object.keys(ordersByMeal).length === 0 ? (
              <div className="p-6 border border-border rounded-lg bg-card text-center">
                <p className="text-muted-foreground">No meal orders found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(ordersByMeal)
                  .sort((a, b) => (a.meal.mealDate > b.meal.mealDate ? 1 : -1))
                  .map((mealData) => (
                    <div
                      key={mealData.meal.id}
                      className="border border-border rounded-lg bg-card overflow-hidden"
                    >
                      {/* Meal Header */}
                      <div className="p-4 bg-muted border-b border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {mealData.meal.name}
                            </h3>
                            <div className="mt-1 space-x-4 text-sm text-muted-foreground">
                              <Link
                                href={`/admin/retreats/${mealData.meal.retreat.id}`}
                                className="text-primary hover:underline"
                              >
                                {mealData.meal.retreat.name}
                              </Link>
                              <span>
                                {formatDateTime(mealData.meal.mealDate)}
                              </span>
                              <span>${mealData.meal.price.toFixed(2)} CAD</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {mealData.totalUsers.size} user
                              {mealData.totalUsers.size !== 1 ? "s" : ""}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {mealData.totalOrders} order
                              {mealData.totalOrders !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Item Counts */}
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          Menu Item Selections:
                        </h4>
                        {mealData.meal.menuItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No menu items available for this meal.
                          </p>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {mealData.meal.menuItems.map((menuItem) => {
                              const count =
                                mealData.menuItemCounts[menuItem.id] || 0;
                              return (
                                <div
                                  key={menuItem.id}
                                  className="p-3 border border-border rounded-lg bg-background"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">
                                      {menuItem.name}
                                    </span>
                                    <span className="text-lg font-bold text-primary">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
