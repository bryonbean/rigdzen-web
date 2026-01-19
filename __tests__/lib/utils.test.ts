import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("text-red-500", false && "text-blue-500");
    expect(result).toBe("text-red-500");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
