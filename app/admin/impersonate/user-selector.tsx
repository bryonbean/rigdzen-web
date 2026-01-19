"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string | null;
  email: string;
}

interface UserSelectorProps {
  users: User[];
}

export function UserSelector({ users }: UserSelectorProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartImpersonation = async () => {
    if (!selectedUserId) {
      alert("Please select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/impersonate/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: parseInt(selectedUserId) }),
      });

      if (response.ok) {
        router.refresh();
        router.push("/dashboard");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to start impersonation");
      }
    } catch (error) {
      console.error("Impersonation error:", error);
      alert("Failed to start impersonation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-3">
        View As User
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Select a user to view the site as if you were them. This allows you to
        see exactly what they see.
      </p>
      <div className="flex gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isSubmitting}
        >
          <option value="">Select a user...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email} ({user.email})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleStartImpersonation}
          disabled={!selectedUserId || isSubmitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Starting..." : "View As"}
        </button>
      </div>
    </div>
  );
}
