import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a Prisma Client with appropriate database configuration.
 *
 * For Turso (production):
 * - Uses libSQL driver adapter with TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
 * - Requires @libsql/client and @prisma/adapter-libsql packages
 *
 * For local SQLite (development):
 * - Uses standard Prisma SQLite connection with DATABASE_URL
 */
function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Production: Use Turso with libSQL driver adapter
  if (tursoUrl && tursoToken) {
    // Validate Turso URL format
    if (!tursoUrl.startsWith("libsql://")) {
      throw new Error(
        "TURSO_DATABASE_URL must start with 'libsql://'. " +
          "Example: libsql://database-name.turso.io"
      );
    }

    console.log(`[Prisma] Using Turso database: ${new URL(tursoUrl).hostname}`);

    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    });

    // Return Prisma Client with libSQL adapter
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  // Local development: Use DATABASE_URL (SQLite)
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Database configuration missing. Set either:\n" +
        "  - DATABASE_URL for local development (SQLite)\n" +
        "  - TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for production (Turso)"
    );
  }

  console.log(`[Prisma] Using local database: ${databaseUrl}`);

  // Return standard Prisma Client for SQLite
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
