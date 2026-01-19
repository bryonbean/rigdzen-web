"use client";

import { useRouter } from "next/navigation";

interface DeleteMealButtonProps {
  retreatId: number;
  mealId: number;
  mealName: string;
}

export function DeleteMealButton({
  retreatId,
  mealId,
  mealName,
}: DeleteMealButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${mealName}"? This will also delete all orders for this meal.`
      )
    ) {
      return;
    }

    const response = await fetch(
      `/api/admin/retreats/${retreatId}/meals/${mealId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      router.refresh();
    } else {
      alert("Failed to delete meal");
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
    >
      Delete
    </button>
  );
}
