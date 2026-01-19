import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DeleteMenuItemButton } from "./delete-menu-item-button";

export default async function MealMenuItemsPage({
  params,
}: {
  params: { id: string; mealId: string };
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
  const mealId = parseInt(params.mealId);

  if (isNaN(retreatId) || isNaN(mealId)) {
    notFound();
  }

  // Get retreat and meal
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href={`/admin/retreats/${retreatId}/meals`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Meals
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Menu Items - {meal.name}
          </h1>
          <p className="text-muted-foreground">
            Add and manage menu items for this meal
          </p>
        </div>

        {/* Add Menu Item Form */}
        <form
          action={`/api/admin/retreats/${retreatId}/meals/${mealId}/menu-items`}
          method="POST"
          className="p-6 border border-border rounded-lg bg-card space-y-4"
        >
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Add Menu Item
          </h2>

          {/* Menu Item Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-card-foreground mb-2"
            >
              Item Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., tapas mixed meat, tapas vegetarian"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-card-foreground mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Optional item description..."
            />
          </div>

          {/* Requires Quantity */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresQuantity"
              name="requiresQuantity"
              className="rounded border-input"
            />
            <label
              htmlFor="requiresQuantity"
              className="text-sm font-medium text-card-foreground"
            >
              Requires quantity (e.g., pizza slices, number of servings)
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              Add Menu Item
            </button>
          </div>
        </form>

        {/* Existing Menu Items */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Menu Items ({meal.menuItems.length})
          </h2>

          {meal.menuItems.length === 0 ? (
            <div className="p-6 border border-border rounded-lg bg-card text-center">
              <p className="text-muted-foreground">
                No menu items added yet. Use the form above to add items.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meal.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                      )}
                      {item.requiresQuantity && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 rounded-full">
                          Requires quantity
                        </span>
                      )}
                    </div>
                    <DeleteMenuItemButton
                      retreatId={retreatId}
                      mealId={mealId}
                      menuItemId={item.id}
                      menuItemName={item.name}
                    />
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
