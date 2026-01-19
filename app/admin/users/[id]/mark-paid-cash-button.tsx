"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MarkPaidCashButtonProps {
  mealOrderId: number;
  amount: number;
}

export function MarkPaidCashButton({
  mealOrderId,
  amount,
}: MarkPaidCashButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkPaid = async () => {
    if (
      !confirm(
        `Mark this meal order as paid with cash ($${amount.toFixed(2)} CAD)?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/meal-orders/${mealOrderId}/mark-paid-cash`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to mark as paid");
      }
    } catch (error) {
      console.error("Mark paid error:", error);
      alert("Failed to mark as paid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMarkPaid}
      disabled={isSubmitting}
      className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Processing..." : "Mark Paid (Cash)"}
    </button>
  );
}
