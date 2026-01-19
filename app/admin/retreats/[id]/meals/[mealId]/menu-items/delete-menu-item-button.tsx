"use client";

import { useRouter } from "next/navigation";

interface DeleteMenuItemButtonProps {
  retreatId: number;
  mealId: number;
  menuItemId: number;
  menuItemName: string;
}

export function DeleteMenuItemButton({
  retreatId,
  mealId,
  menuItemId,
  menuItemName,
}: DeleteMenuItemButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${menuItemName}"?`)) {
      return;
    }

    const response = await fetch(
      `/api/admin/retreats/${retreatId}/meals/${mealId}/menu-items/${menuItemId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      router.refresh();
    } else {
      alert("Failed to delete menu item");
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
