# Turso Setup Guide for Vercel

## What is Turso?

Turso is a distributed SQLite database built for serverless environments like Vercel. It's SQLite-compatible, so you can use the same Prisma schema and queries.

**Important:** SQLite does not work in serverless environments like Vercel. Turso is required for production deployments.

## Setup Steps

### 1. Install Turso CLI (optional, for local development)

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Or use Homebrew:
```bash
brew install tursodatabase/tap/turso
```

### 2. Create a Turso Database

```bash
# Login to Turso
turso auth login

# Create a database
turso db create rigdzen-db

# Create a database token (for production)
turso db tokens create rigdzen-db
```

### 3. Update Prisma Schema

The schema needs to support both SQLite (local) and libSQL (Turso). Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

For Turso, your `DATABASE_URL` will look like:
```
libsql://rigdzen-db-orgyenrigdzen.turso.io?authToken=your-auth-token
```

### 4. Environment Variables

This project uses explicit Turso configuration variables for production:

**Local Development (.env):**
Set only `DATABASE_URL` in your `.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
```

**Vercel Production:**
Set Turso variables in Vercel Dashboard → Settings → Environment Variables → Production:
```env
TURSO_DATABASE_URL="libsql://rigdzen-db-orgyenrigdzen.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
```

**How It Works:**
- The application automatically detects which environment to use based on which variables are set
- If `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are present, it uses Turso (production)
- Otherwise, it falls back to `DATABASE_URL` (local SQLite)
- This allows seamless switching between local development and production

### 5. Run Migrations

After creating the Turso database, run migrations:

```bash
# Generate Prisma Client
yarn prisma generate

# Push schema to Turso (or run migrations)
yarn prisma db push
# OR
yarn prisma migrate deploy
```

### 6. Local Development with Turso (Optional)

You can use Turso locally too:

```bash
# Get local connection string
turso db shell rigdzen-db

# Or use the remote URL in your .env.local
DATABASE_URL="libsql://rigdzen-db-orgyenrigdzen.turso.io?authToken=your-local-token"
```

## Benefits

- ✅ SQLite-compatible (same Prisma schema)
- ✅ Serverless-friendly (works on Vercel)
- ✅ Global replication
- ✅ Free tier available
- ✅ No schema changes needed

## Alternative: Vercel Postgres

If you prefer a more traditional database, Vercel Postgres is also a great option:

1. Go to Vercel Dashboard → Your Project → Storage → Create Database
2. Choose "Postgres"
3. Vercel will automatically set `POSTGRES_URL` environment variable
4. Update Prisma schema to use `provider = "postgresql"`

## Migration Strategy

1. **Development:** Keep using SQLite locally (`file:./prisma/dev.db`)
2. **Production:** Use Turso (`libsql://...`) or Vercel Postgres
3. Use environment variables to switch between them automatically

## Resources

- Turso Docs: https://docs.turso.tech
- Vercel + Turso: https://vercel.com/marketplace/tursocloud
- Prisma + Turso: https://docs.turso.tech/tutorials/prisma
