"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string | null;
  email: string;
}

interface AssignDutyFormProps {
  retreatId: number;
  dutyId: number;
  assignedUserIds: number[];
  users: User[];
  dutyCountsByUser?: Record<number, number>;
}

export function AssignDutyForm({
  retreatId,
  dutyId,
  assignedUserIds,
  users,
  dutyCountsByUser = {},
}: AssignDutyFormProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out already assigned users from dropdown
  const availableUsers = users.filter(
    (user) => !assignedUserIds.includes(user.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);

    try {
      const userId = parseInt(selectedUserId);

      const response = await fetch(
        `/api/admin/retreats/${retreatId}/duties/${dutyId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, action: "add" }),
        }
      );

      if (response.ok) {
        // Reset submitting state and form
        setIsSubmitting(false);
        setSelectedUserId("");
        // Refresh to get updated data
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to assign duty");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Failed to assign duty. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Remove this assignment?")) return;

    try {
      const response = await fetch(
        `/api/admin/retreats/${retreatId}/duties/${dutyId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, action: "remove" }),
        }
      );

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove assignment");
      }
    } catch (error) {
      console.error("Remove assignment error:", error);
      alert("Failed to remove assignment. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="inline-block">
      <div className="flex items-center gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={isSubmitting || availableUsers.length === 0}
          className="px-3 py-1 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value="">Select user...</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id.toString()}>
              {user.name || user.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={
            isSubmitting || !selectedUserId || availableUsers.length === 0
          }
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Add"}
        </button>
      </div>
      {assignedUserIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {assignedUserIds.map((userId) => {
            const user = users.find((u) => u.id === userId);
            if (!user) return null;
            return (
              <span
                key={userId}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
              >
                {user.name || user.email}
                {dutyCountsByUser[userId] > 0 && (
                  <> ({dutyCountsByUser[userId]})</>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(userId)}
                  className="text-primary hover:text-primary/70"
                  title="Remove assignment"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </form>
  );
}
