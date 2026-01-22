import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Constructs the database connection URL based on environment variables.
 *
 * Priority:
 * 1. If TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set → Use Turso (production)
 * 2. Otherwise → Use DATABASE_URL (local SQLite)
 */
function getDatabaseUrl(): string {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Production: Use Turso with auth token
  if (tursoUrl && tursoToken) {
    // Validate Turso URL format
    if (!tursoUrl.startsWith("libsql://")) {
      throw new Error(
        "TURSO_DATABASE_URL must start with 'libsql://'. " +
          "Example: libsql://database-name.turso.io"
      );
    }

    // Construct connection string with auth token
    const url = new URL(tursoUrl);
    url.searchParams.set("authToken", tursoToken);

    console.log(`[Prisma] Using Turso database: ${url.hostname}`);
    return url.toString();
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
  return databaseUrl;
}

// Override DATABASE_URL for Prisma Client
process.env.DATABASE_URL = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
