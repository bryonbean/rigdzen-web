"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AttendButtonProps {
  retreatId: number;
  isAttending: boolean;
}

export function AttendButton({ retreatId, isAttending }: AttendButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async () => {
    setIsSubmitting(true);

    try {
      const endpoint = isAttending
        ? `/api/retreats/${retreatId}/decline`
        : `/api/retreats/${retreatId}/attend`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (response.ok) {
        // Use full page reload to ensure server components re-render with updated data
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update attendance");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Attendance toggle error:", error);
      alert("Failed to update attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isSubmitting}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isAttending
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {isSubmitting
        ? "Processing..."
        : isAttending
          ? "Decline Attendance"
          : "Attend"}
    </button>
  );
}
