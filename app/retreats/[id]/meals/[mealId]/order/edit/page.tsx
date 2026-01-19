import { redirect, notFound } from "next/navigation";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { OrderMealForm } from "../order-meal-form";

export default async function EditMealOrderPage({
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

  if (!canOrder) {
    redirect(`/retreats/${retreatId}/meals/${mealId}/order`);
  }

  // Get existing order
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

  if (!existingOrder) {
    redirect(`/retreats/${retreatId}/meals/${mealId}/order`);
  }

  // Pre-fill selected items from existing order
  const preSelectedItems: Record<
    number,
    { selected: boolean; quantity?: number }
  > = {};
  existingOrder.menuItems.forEach((orderItem) => {
    preSelectedItems[orderItem.menuItemId] = {
      selected: true,
      quantity: orderItem.quantity || undefined,
    };
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
            href={`/retreats/${retreatId}/meals/${mealId}/order`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Order
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Edit Order - {meal.name}
          </h1>
          <p className="text-muted-foreground">
            Update your menu item selections and quantities
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

        {/* Order Form with pre-selected items */}
        {meal.menuItems.length === 0 ? (
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
            initialSelectedItems={preSelectedItems}
          />
        )}
      </div>
    </main>
  );
}
