import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DeleteMealButton } from "./delete-meal-button";

export default async function AdminMealsPage({
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

  // Get retreat and meals
  const retreat = await prisma.retreat.findUnique({
    where: { id: retreatId },
    include: {
      meals: {
        orderBy: { mealDate: "asc" },
        include: {
          menuItems: {
            orderBy: { name: "asc" },
          },
          _count: {
            select: {
              mealOrders: true,
            },
          },
        },
      },
    },
  });

  if (!retreat) {
    notFound();
  }

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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href={`/admin/retreats/${retreat.id}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Retreat
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Manage Meals - {retreat.name}
          </h1>
          <p className="text-muted-foreground">
            Add and manage meals for this retreat
          </p>
        </div>

        {/* Add Meal Form */}
        <form
          action={`/api/admin/retreats/${retreat.id}/meals`}
          method="POST"
          className="p-6 border border-border rounded-lg bg-card space-y-4"
        >
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Add New Meal
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Meal Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Meal Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Saturday Lunch"
              />
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Price (CAD) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                required
                defaultValue="35.00"
                className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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
              placeholder="Optional meal description..."
            />
          </div>

          {/* Meal Date */}
          <div>
            <label
              htmlFor="mealDate"
              className="block text-sm font-medium text-card-foreground mb-2"
            >
              Meal Date & Time <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              id="mealDate"
              name="mealDate"
              required
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Available */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              name="available"
              defaultChecked
              className="rounded border-input"
            />
            <label
              htmlFor="available"
              className="text-sm font-medium text-card-foreground"
            >
              Available for ordering
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              Add Meal
            </button>
          </div>
        </form>

        {/* Existing Meals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Meals ({retreat.meals.length})
          </h2>

          {retreat.meals.length === 0 ? (
            <div className="p-6 border border-border rounded-lg bg-card text-center">
              <p className="text-muted-foreground">
                No meals added yet. Use the form above to add meals.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {retreat.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {meal.name}
                      </h3>
                      {meal.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {meal.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(meal.mealDate)}</span>
                        <span className="font-medium text-card-foreground">
                          ${meal.price.toFixed(2)} CAD
                        </span>
                        <span>{meal._count.mealOrders} orders</span>
                        <span>{meal.menuItems?.length || 0} menu items</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/retreats/${retreat.id}/meals/${meal.id}/menu-items`}
                        className="px-3 py-1 text-sm font-medium border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors"
                      >
                        Manage Menu
                      </Link>
                      <div className="flex items-center gap-2">
                        {meal.available ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 rounded-full">
                            Unavailable
                          </span>
                        )}
                        <DeleteMealButton
                          retreatId={retreat.id}
                          mealId={meal.id}
                          mealName={meal.name}
                        />
                      </div>
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
