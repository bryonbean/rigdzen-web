"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CopyRetreatSelector } from "./copy-retreat-selector";

interface Retreat {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface CopyRetreatFormProps {
  retreats: Retreat[];
}

export function CopyRetreatForm({ retreats }: CopyRetreatFormProps) {
  const router = useRouter();
  const [sourceRetreatId, setSourceRetreatId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Add sourceRetreatId if one is selected
    if (sourceRetreatId) {
      formData.append("sourceRetreatId", sourceRetreatId.toString());
    }

    try {
      const response = await fetch("/api/admin/retreats", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.redirectUrl) {
          // Use window.location.href for full page navigation
          window.location.href = data.redirectUrl;
          return; // Don't reset isSubmitting since we're navigating away
        } else if (data.retreatId) {
          // Fallback: construct URL from retreatId
          window.location.href = `/admin/retreats/${data.retreatId}`;
          return;
        } else {
          // Unexpected response format
          console.error("Unexpected response format:", data);
          alert(
            "Retreat created but redirect failed. Please refresh the page."
          );
          setIsSubmitting(false);
        }
      } else {
        // Handle error response
        try {
          const data = await response.json();
          alert(data.error || "Failed to create retreat");
        } catch {
          alert("Failed to create retreat. Please try again.");
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Retreat creation error:", error);
      alert("Failed to create retreat. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Copy from Existing Retreat */}
      <CopyRetreatSelector retreats={retreats} onSelect={setSourceRetreatId} />

      {/* Retreat Form */}
      <div className="p-6 border border-border rounded-lg bg-card space-y-6">
        {/* Retreat Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Retreat Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., Weekend Ngondro Retreat"
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
            rows={4}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Brief description of the retreat..."
          />
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Start Date <span className="text-destructive">*</span>
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            required
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            End Date <span className="text-destructive">*</span>
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            required
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., Orgyen Khamdroling, Vancouver"
          />
        </div>

        {/* Meal Order Deadline */}
        <div>
          <label
            htmlFor="mealOrderDeadline"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Meal Order Deadline
          </label>
          <input
            type="datetime-local"
            id="mealOrderDeadline"
            name="mealOrderDeadline"
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            When meal ordering closes (typically 3 days before retreat)
          </p>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="UPCOMING"
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="UPCOMING">Upcoming</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Retreat"}
          </button>
          <Link
            href="/admin/retreats"
            className="px-6 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring font-medium inline-block"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
