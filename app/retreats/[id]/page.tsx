import { redirect, notFound } from "next/navigation";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getActiveParticipantCount } from "@/lib/utils/retreat-participants";
import Link from "next/link";
import { formatDescription } from "@/lib/utils/format-description";
import { SignOffButton } from "./duties/sign-off-button";
import { PayPalCheckoutButton } from "./paypal-checkout-button";
import { AttendButton } from "./attend-button";

export default async function RetreatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getEffectiveSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
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
        include: {
          menuItems: {
            orderBy: { name: "asc" },
          },
        },
      },
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
      registrations: {
        where: { userId: session.userId },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  if (!retreat) {
    notFound();
  }

  // Get count of active (non-cancelled) registrations
  const activeParticipantCount = await getActiveParticipantCount(retreatId);

  // Get user's meal orders for this retreat
  const mealOrders = await prisma.mealOrder.findMany({
    where: {
      userId: session.userId,
      retreatId: retreatId,
    },
    include: {
      meal: {
        include: {
          menuItems: true,
        },
      },
      payment: true,
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  const userRegistration = retreat.registrations.find(
    (r) => r.status !== "CANCELLED"
  );
  const isAttending = !!userRegistration;

  // Filter duties to only those assigned to the current user
  const userDuties = retreat.duties.filter((duty) =>
    duty.assignments.some((assignment) => assignment.userId === session.userId)
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
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

  // Calculate total meal cost accounting for quantities
  const calculateOrderCost = (
    order: (typeof mealOrders)[0],
    includePending: boolean = false
  ) => {
    // For completed payments, use the actual payment amount stored in the database
    if (order.payment && order.payment.status === "COMPLETED") {
      return order.payment.amount;
    }

    // For pending orders (when includePending is true), calculate based on menu items
    if (includePending && order.status === "PENDING") {
      const quantities = order.menuItems
        .map((item) => item.quantity)
        .filter((q): q is number => q !== null);
      const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;

      return order.meal.price * maxQuantity;
    }

    return 0;
  };

  // Calculate total paid - use actual payment amounts from database
  const totalMealCost = mealOrders.reduce((sum, order) => {
    if (order.payment && order.payment.status === "COMPLETED") {
      return sum + order.payment.amount;
    }
    return sum;
  }, 0);

  const pendingMeals = mealOrders.filter((order) => order.status === "PENDING");
  const paidMeals = mealOrders.filter(
    (order) => order.payment?.status === "COMPLETED"
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/retreats"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Retreats
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {retreat.name}
          </h1>
          {retreat.description && (
            <p className="text-muted-foreground mb-4">{retreat.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                {formatDate(retreat.startDate)} - {formatDate(retreat.endDate)}
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
              <span>{activeParticipantCount} participants</span>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <section className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Attendance
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAttending
                  ? "You are attending this retreat"
                  : "Indicate if you will be attending this retreat"}
              </p>
            </div>
            <AttendButton retreatId={retreatId} isAttending={isAttending} />
          </div>
        </section>

        {/* Meals Section - Only show if attending */}
        {isAttending && (
          <section className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              Meal Selection
            </h2>

            {retreat.meals.length === 0 ? (
              <p className="text-muted-foreground">
                No meals available for this retreat.
              </p>
            ) : (
              <div className="space-y-4">
                {retreat.meals.map((meal) => {
                  const order = mealOrders.find((o) => o.mealId === meal.id);
                  const isOrdered = !!order;
                  const isPaid = order?.payment?.status === "COMPLETED";

                  return (
                    <div
                      key={meal.id}
                      className="p-4 border border-border rounded-lg bg-background"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {meal.name}
                          </h3>
                          {meal.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {meal.description}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDateTime(meal.mealDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-foreground">
                            {isOrdered && order
                              ? (() => {
                                  // Calculate cost: use payment amount if paid, otherwise calculate from quantities
                                  if (order.payment?.status === "COMPLETED") {
                                    return `$${order.payment.amount.toFixed(2)} CAD`;
                                  }
                                  const quantities = order.menuItems
                                    .map((item) => item.quantity)
                                    .filter((q): q is number => q !== null);
                                  const maxQuantity =
                                    quantities.length > 0
                                      ? Math.max(...quantities)
                                      : 1;
                                  return `$${(meal.price * maxQuantity).toFixed(2)} CAD`;
                                })()
                              : `$${meal.price.toFixed(2)} CAD`}
                          </div>
                          {isOrdered && (
                            <span
                              className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                                isPaid
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-yellow-500/10 text-yellow-600"
                              }`}
                            >
                              {isPaid ? "Paid" : "Pending"}
                            </span>
                          )}
                        </div>
                      </div>

                      {meal.available ? (
                        <Link
                          href={`/retreats/${retreatId}/meals/${meal.id}/order`}
                          className={`inline-block mt-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            isOrdered
                              ? "border border-input bg-background text-foreground hover:bg-accent"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isOrdered ? "View/Update Order" : "Select Meal"}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          Not available
                        </p>
                      )}
                    </div>
                  );
                })}

                {pendingMeals.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        Pending Payment
                      </span>
                      <span className="font-semibold text-foreground">
                        $
                        {pendingMeals
                          .reduce(
                            (sum, order) =>
                              sum + calculateOrderCost(order, true),
                            0
                          )
                          .toFixed(2)}{" "}
                        CAD
                      </span>
                    </div>
                    <div className="mt-2">
                      <PayPalCheckoutButton
                        retreatId={retreatId}
                        totalAmount={pendingMeals.reduce(
                          (sum, order) => sum + calculateOrderCost(order, true),
                          0
                        )}
                      />
                    </div>
                  </div>
                )}

                {paidMeals.length > 0 && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        Total Paid
                      </span>
                      <span className="font-semibold text-foreground">
                        ${totalMealCost.toFixed(2)} CAD
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Duties Section - Only show if attending */}
        {isAttending && (
          <section className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              My Retreat Duties
            </h2>

            {userDuties.length === 0 ? (
              <p className="text-muted-foreground">
                You don&apos;t have any assigned duties for this retreat.
              </p>
            ) : (
              <div className="space-y-3">
                {userDuties.map((duty) => {
                  const userAssignment = duty.assignments.find(
                    (a) => a.userId === session.userId
                  );
                  if (!userAssignment) return null;
                  return (
                    <div
                      key={duty.id}
                      className="p-4 border border-border rounded-lg bg-background"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {duty.title}
                          </h3>
                          {duty.description && (
                            <div className="mt-1">
                              {formatDescription(duty.description)}
                            </div>
                          )}
                          {userAssignment.assignedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Assigned: {formatDate(userAssignment.assignedAt)}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          <SignOffButton
                            retreatId={retreatId}
                            dutyId={duty.id}
                            assignmentStatus={userAssignment.status}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
