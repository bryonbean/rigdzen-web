"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Retreat {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

interface RetreatFilterProps {
  retreats: Retreat[];
  currentRetreatId: number | null;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

export function RetreatFilter({
  retreats,
  currentRetreatId,
}: RetreatFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRetreatChange = (retreatId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (retreatId) {
      params.set("retreatId", retreatId);
    } else {
      params.delete("retreatId");
    }
    // Preserve view parameter
    const view = searchParams.get("view") || "users";
    params.set("view", view);
    router.push(`/admin/reports/user-meal-selections?${params.toString()}`);
  };

  return (
    <select
      value={currentRetreatId?.toString() || ""}
      onChange={(e) => handleRetreatChange(e.target.value)}
      className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
    >
      <option value="">All Retreats</option>
      {retreats.map((retreat) => (
        <option key={retreat.id} value={retreat.id.toString()}>
          {retreat.name} ({formatDate(retreat.startDate)})
        </option>
      ))}
    </select>
  );
}
