"use client";

import { useState, useEffect } from "react";

interface Retreat {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface CopyRetreatSelectorProps {
  retreats: Retreat[];
  onSelect: (retreatId: number | null) => void;
}

export function CopyRetreatSelector({
  retreats,
  onSelect,
}: CopyRetreatSelectorProps) {
  const [selectedRetreatId, setSelectedRetreatId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (selectedRetreatId) {
      onSelect(parseInt(selectedRetreatId));
    } else {
      onSelect(null);
    }
  }, [selectedRetreatId, onSelect]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  if (retreats.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Copy from Existing Retreat
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Optionally copy meals and duties from another retreat
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (isExpanded) {
              setSelectedRetreatId("");
            }
          }}
          className="text-sm text-primary hover:underline"
        >
          {isExpanded ? "Cancel" : "Select Retreat"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          <select
            value={selectedRetreatId}
            onChange={(e) => {
              setSelectedRetreatId(e.target.value);
              if (e.target.value) {
                setIsExpanded(false);
              }
            }}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a retreat to copy from...</option>
            {retreats.map((retreat) => (
              <option key={retreat.id} value={retreat.id}>
                {retreat.name} (
                {formatDateRange(retreat.startDate, retreat.endDate)})
              </option>
            ))}
          </select>

          {selectedRetreatId && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-foreground">
                <span className="font-medium">Selected:</span>{" "}
                {
                  retreats.find((r) => r.id === parseInt(selectedRetreatId))
                    ?.name
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Meals (with menu items) and duties will be copied. User
                assignments and orders will not be copied.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedRetreatId && !isExpanded && (
        <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Copying from:{" "}
                {
                  retreats.find((r) => r.id === parseInt(selectedRetreatId))
                    ?.name
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRetreatId("");
                onSelect(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
