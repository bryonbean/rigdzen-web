import { redirect, notFound } from "next/navigation";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { OrderMealForm } from "./order-meal-form";

export default async function OrderMealPage({
  params,
}: {
  params: { id: string; mealId: string };
}) {
  const session = await getEffectiveSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  const retreatId = parseInt(params.id);
  const mealId = parseInt(params.mealId);

  if (isNaN(retreatId) || isNaN(mealId)) {
    notFound();
  }

  // Get retreat and meal with menu items
  const retreat = await prisma.retreat.findUnique({
    where: { id: retreatId },
    include: {
      meals: {
        where: { id: mealId },
        include: {
          menuItems: {
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  if (!retreat || retreat.meals.length === 0) {
    notFound();
  }

  const meal = retreat.meals[0];

  // Check if meal is available and within ordering deadline
  const now = new Date();
  const isPastDeadline =
    retreat.mealOrderDeadline && new Date(retreat.mealOrderDeadline) < now;
  const canOrder = meal.available && !isPastDeadline;

  // Check if user already ordered this meal
  const existingOrder = await prisma.mealOrder.findUnique({
    where: {
      userId_mealId: {
        userId: session.userId,
        mealId: meal.id,
      },
    },
    include: {
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link
            href={`/retreats/${retreatId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Retreat
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Order {meal.name}
          </h1>
          <p className="text-muted-foreground">
            Select menu items and quantities for this meal
          </p>
        </div>

        {/* Meal Info */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-card-foreground">
              {meal.name}
            </h2>
            {meal.description && (
              <p className="text-muted-foreground">{meal.description}</p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{formatDateTime(meal.mealDate)}</span>
              <span className="font-medium text-card-foreground">
                ${meal.price.toFixed(2)} CAD
              </span>
            </div>
            {retreat.mealOrderDeadline && (
              <p className="text-sm text-muted-foreground">
                Order deadline: {formatDateTime(retreat.mealOrderDeadline)}
              </p>
            )}
          </div>
        </div>

        {/* Order Form or Status */}
        {!canOrder ? (
          <div className="p-6 border border-border rounded-lg bg-muted text-center">
            <p className="text-muted-foreground">
              {!meal.available
                ? "This meal is not available for ordering."
                : "The ordering deadline has passed."}
            </p>
          </div>
        ) : existingOrder ? (
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              Your Order
            </h2>
            <div className="space-y-3">
              {existingOrder.menuItems.length === 0 ? (
                <p className="text-muted-foreground">
                  No menu items selected (order cancelled or empty)
                </p>
              ) : (
                existingOrder.menuItems.map((orderItem) => (
                  <div
                    key={orderItem.id}
                    className="flex items-center justify-between p-3 border border-border rounded bg-background"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {orderItem.menuItem.name}
                      </span>
                      {orderItem.menuItem.requiresQuantity &&
                        orderItem.quantity && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (Quantity: {orderItem.quantity})
                          </span>
                        )}
                    </div>
                    {existingOrder.status === "PAID" && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                        Paid
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            {existingOrder.status === "PENDING" && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Your order is pending payment.
                </p>
                <Link
                  href={`/retreats/${retreatId}/meals/${mealId}/order/edit`}
                  className="inline-block px-4 py-2 text-sm font-medium border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  Edit Order
                </Link>
              </div>
            )}
          </div>
        ) : meal.menuItems.length === 0 ? (
          <div className="p-6 border border-border rounded-lg bg-card text-center">
            <p className="text-muted-foreground">
              No menu items available for this meal yet.
            </p>
          </div>
        ) : (
          <OrderMealForm
            retreatId={retreatId}
            mealId={meal.id}
            mealPrice={meal.price}
            menuItems={meal.menuItems}
          />
        )}
      </div>
    </main>
  );
}
