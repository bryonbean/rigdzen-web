import { prisma } from "@/lib/prisma";

/**
 * Get the count of active (non-cancelled) participants for a retreat
 */
export async function getActiveParticipantCount(
  retreatId: number
): Promise<number> {
  return await prisma.retreatRegistration.count({
    where: {
      retreatId,
      status: { not: "CANCELLED" },
    },
  });
}

/**
 * Get active participant counts for multiple retreats
 * Returns a Map of retreatId -> count
 */
export async function getActiveParticipantCounts(
  retreatIds: number[]
): Promise<Map<number, number>> {
  if (retreatIds.length === 0) {
    return new Map();
  }

  const activeRegistrations = await prisma.retreatRegistration.groupBy({
    by: ["retreatId"],
    where: {
      retreatId: { in: retreatIds },
      status: { not: "CANCELLED" },
    },
    _count: {
      id: true,
    },
  });

  return new Map(activeRegistrations.map((r) => [r.retreatId, r._count.id]));
}
