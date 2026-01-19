"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StopImpersonationButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStop = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/impersonate/stop", {
        method: "POST",
      });

      if (response.ok) {
        // Use full page reload to ensure server components re-render with updated cookie state
        window.location.href = "/admin";
      } else {
        const data = await response.json();
        alert(data.error || "Failed to stop impersonation");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Stop impersonation error:", error);
      alert("Failed to stop impersonation. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleStop}
      disabled={isSubmitting}
      className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Stopping..." : "Stop Viewing As"}
    </button>
  );
}
