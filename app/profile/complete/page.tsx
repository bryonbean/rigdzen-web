import { redirect } from "next/navigation";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function ProfileCompletePage() {
  const session = await getEffectiveSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/");
  }

  // Check if user already completed profile
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (user?.profileCompleted) {
    redirect("/dashboard");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s finish setting up your account
          </p>
        </div>

        <form
          action="/api/profile/complete"
          method="POST"
          className="space-y-6 p-6 border border-border rounded-lg bg-card"
        >
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-card-foreground mb-2"
            >
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={user?.name || ""}
              required
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter your name"
            />
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label
              htmlFor="dietaryRestrictions"
              className="block text-sm font-medium text-card-foreground mb-2"
            >
              Dietary Restrictions{" "}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vegetarian"
                  name="dietaryRestrictions"
                  value="vegetarian"
                  className="rounded border-input"
                />
                <label
                  htmlFor="vegetarian"
                  className="text-sm text-card-foreground"
                >
                  Vegetarian
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vegan"
                  name="dietaryRestrictions"
                  value="vegan"
                  className="rounded border-input"
                />
                <label htmlFor="vegan" className="text-sm text-card-foreground">
                  Vegan
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="glutenFree"
                  name="dietaryRestrictions"
                  value="gluten-free"
                  className="rounded border-input"
                />
                <label
                  htmlFor="glutenFree"
                  className="text-sm text-card-foreground"
                >
                  Gluten-Free
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allergies"
                  name="dietaryRestrictions"
                  value="allergies"
                  className="rounded border-input"
                />
                <label
                  htmlFor="allergies"
                  className="text-sm text-card-foreground"
                >
                  Food Allergies
                </label>
              </div>
            </div>
            <textarea
              id="dietaryNotes"
              name="dietaryNotes"
              rows={3}
              className="mt-2 w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Additional dietary notes or specific allergies..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Complete Profile
            </button>
            <a
              href="/api/profile/complete?skip=true"
              className="px-6 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring inline-block text-center"
            >
              Skip for Now
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
