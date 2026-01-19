import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function UnpaidMealsReportPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Redirect if not admin
  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  // Get all unpaid meal orders
  const unpaidOrders = await prisma.mealOrder.findMany({
    where: {
      status: "PENDING",
    },
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
        },
      },
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: [
      { meal: { retreat: { startDate: "desc" } } },
      { meal: { mealDate: "asc" } },
      { createdAt: "asc" },
    ],
  });

  // Calculate totals
  const totalUnpaidAmount = unpaidOrders.reduce((sum, order) => {
    const quantities = order.menuItems
      .map((item) => item.quantity)
      .filter((q): q is number => q !== null);
    const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
    return sum + order.meal.price * maxQuantity;
  }, 0);

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
            Unpaid Meals Report
          </h1>
          <p className="text-muted-foreground">
            All meal orders pending payment
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Unpaid Orders
              </p>
              <p className="text-2xl font-bold text-foreground">
                {unpaidOrders.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Unpaid Amount
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${totalUnpaidAmount.toFixed(2)} CAD
              </p>
            </div>
          </div>
        </div>

        {/* Unpaid Orders Table */}
        {unpaidOrders.length === 0 ? (
          <div className="p-6 border border-border rounded-lg bg-card text-center">
            <p className="text-muted-foreground">
              No unpaid meal orders found. All orders have been paid!
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      User
                    </th>
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
                      Ordered
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unpaidOrders.map((order) => {
                    const quantities = order.menuItems
                      .map((item) => item.quantity)
                      .filter((q): q is number => q !== null);
                    const maxQuantity =
                      quantities.length > 0 ? Math.max(...quantities) : 1;
                    const amount = order.meal.price * maxQuantity;

                    return (
                      <tr key={order.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {order.user.name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/retreats/${order.meal.retreat.id}`}
                            className="text-primary hover:underline"
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
                            ${amount.toFixed(2)} CAD
                          </p>
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
        )}
      </div>
    </main>
  );
}
