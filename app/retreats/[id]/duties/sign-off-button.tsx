"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SignOffButtonProps {
  retreatId: number;
  dutyId: number;
  assignmentStatus: string;
}

export function SignOffButton({
  retreatId,
  dutyId,
  assignmentStatus,
}: SignOffButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOff = async () => {
    if (!confirm("Have you read and understood this duty description?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/retreats/${retreatId}/duties/${dutyId}/sign-off`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to acknowledge. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Acknowledge error:", error);
      alert("Failed to acknowledge. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (assignmentStatus === "COMPLETED") {
    return (
      <span className="inline-block px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
        Acknowledged
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOff}
      disabled={isSubmitting}
      className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Acknowledging..." : "Acknowledge"}
    </button>
  );
}
