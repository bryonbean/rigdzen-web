# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rigdzen is a web application for Buddhist retreat coordination and sangha community management. It provides administrative capabilities for retreat organizers while offering participants streamlined access to retreat services, schedules, and spiritual practice tracking. The platform serves 20-40 participants per retreat for organizations like Orgyen Khamdroling and OKL Canada.

## Technology Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **UI:** Tailwind CSS + shadcn/ui components
- **State Management:**
  - Zustand (client state - UI/local state)
  - TanStack Query (server state - API data)
  - Redux-saga (complex side effects when needed)
- **Database:** Prisma ORM with SQLite (development) / Turso libSQL (production)
- **Authentication:** Custom JWT session management (jose library)
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint + Prettier + Husky pre-commit hooks

## Development Commands

### Essential Commands
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build production (runs prisma generate, ensure-admin-user, next build)
npm run test             # Run tests in watch mode
npm run lint             # Lint and auto-fix code
npm run format           # Format code with Prettier
```

### Database Commands
```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open database GUI
npm run ensure:admin     # Create/update admin user
```

### Development Scripts
```bash
npm run seed:retreat1    # Seed test data for development
npm run seed:users       # Add test user accounts
npm run upsert:users     # Import users from CSV
```

## Architecture Highlights

### Database (Prisma)

**Schema Location:** `prisma/schema.prisma`

**Core Models:**
- **User** - Authentication & profiles (roles: PARTICIPANT, ADMIN)
- **OAuthAccount** - Multi-provider OAuth (Google, Apple)
- **Retreat** - Retreat events with dates and status
- **Meal** / **MenuItem** - Meal ordering system
- **MealOrder** / **MealOrderMenuItem** - User meal selections with payment tracking
- **Duty** / **DutyAssignment** - Task assignment system
- **Payment** - Payment records (PayPal integration)
- **RetreatRegistration** - Retreat attendance tracking

**Database Configuration:**
- **Local:** `DATABASE_URL="file:./prisma/dev.db"` (SQLite)
- **Production:** Use Turso with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- **Connection Method:** Uses Prisma driver adapters (`@prisma/adapter-libsql` + `@libsql/client`)
- **Migration Pattern:** SQL migrations in `prisma/migrations/`

**Important:** Turso is required for production/Vercel deployments. SQLite does not work in serverless environments. The application uses Prisma's libSQL driver adapter to connect to Turso while keeping the schema SQLite-compatible. See `TURSO_SETUP.md` for setup instructions.

### Authentication Flow

**Custom JWT implementation** (not NextAuth):
- **Session Library:** jose 6.1.3 for JWT operations
- **Session Management:** `/lib/auth/session.ts`
- **Route Protection:** `/lib/auth/middleware.ts` exports `requireAuth()` and `requireAdmin()`
- **Session Cookie:** `rigdzen-session` (httpOnly, sameSite=lax, 7-day expiration)
- **Impersonation:** Dev-only feature via `rigdzen-impersonate` cookie

**Flow:**
1. User visits `/` (login page)
2. Google OAuth button → `/api/auth/google` → Google consent
3. Callback → `/api/auth/google/callback` → Creates/updates user → Sets JWT cookie
4. Protected routes call `getSession()` to verify JWT
5. First login redirects to `/profile/complete` for profile setup
6. Admin role grants access to `/admin/*` routes

**Security Notes:**
- JWT tokens have 7-day lifetime (longer than recommended 15 min for stateless JWT)
- Uses httpOnly cookies (good - prevents XSS)
- SameSite=lax (consider upgrading to Strict for CSRF protection)
- Custom implementation tracks session state (consider opaque tokens + server-side sessions)

### Directory Structure

```
app/
├── page.tsx              # Login page (public)
├── layout.tsx            # Root layout with providers
├── dashboard/            # User dashboard
├── profile/complete/     # Profile completion flow
├── retreats/             # Participant features
│   └── [id]/
│       ├── meals/        # Meal ordering
│       └── duties/       # Duty viewing
├── admin/                # Admin-only routes
│   ├── users/            # User management
│   ├── retreats/         # Retreat management
│   │   └── [id]/
│   │       ├── meals/    # Meal management
│   │       └── duties/   # Duty management
│   ├── reports/          # Analytics
│   └── impersonate/      # Dev-only user switching
└── api/                  # Route handlers (REST-style)
    ├── auth/
    ├── profile/
    ├── retreats/
    └── admin/

lib/
├── prisma.ts             # Singleton Prisma client (prevents serverless connection issues)
├── auth/
│   ├── session.ts        # JWT session management
│   └── middleware.ts     # Route protection helpers
├── paypal/
│   └── config.ts         # PayPal API wrapper
├── providers/            # React context providers
├── stores/               # Zustand stores
└── utils/                # Utility functions

components/
├── ui/                   # shadcn/ui components
└── [feature-specific]    # Feature components

scripts/                  # Database seeding & maintenance
prisma/                   # Schema & migrations
```

### State Management Patterns

**Use Zustand for:**
- UI state (modals, toggles, form state)
- Client-only state that doesn't come from the server
- Keep stores focused and domain-scoped

**Use TanStack Query for:**
- API data fetching and caching
- Server state synchronization
- Mutations for data updates

**Use redux-saga for:**
- Complex side effect orchestration (use sparingly)
- Prefer TanStack Query mutations for simpler cases

### Component Patterns

**Container/Presentation Pattern:**
- Use when you need persisted state
- Containers: Import and wire state/actions to presentation components (no direct UI markup)
- Containers: NEVER contain business logic (business logic goes in separate modules)
- Presentation: Pure UI components that receive props

**Best Practices:**
- Functional programming approaches (pure functions, immutability, composition)
- Prefer `const` over `let` and `var`
- Separate state management, UI, and side effects into different modules

### Routing & Protection

**Public Routes:**
- `/` - Login page

**Protected Routes (require authentication):**
- `/dashboard` - User dashboard
- `/profile/complete` - Profile setup
- `/retreats/[id]/*` - Participant retreat features

**Admin Routes (require ADMIN role):**
- `/admin/*` - All admin features

**Route Protection Pattern:**
```typescript
import { requireAuth, requireAdmin } from "@/lib/auth/middleware";

// In server components or API routes
const session = await requireAuth(); // Redirects if not authenticated
const adminSession = await requireAdmin(); // Redirects if not admin
```

### External Integrations

**Google OAuth:**
- Variables: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`
- Redirect URI: Dynamic via `/lib/utils/get-base-url.ts` (handles local/production)
- Calendar aggregation: `GOOGLE_CALENDAR_IDS` (comma-separated)

**PayPal:**
- Library: @paypal/server-sdk 2.1.0
- Variables: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT`
- Default: Sandbox mode
- Frontend: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` exposed to client

**CSV Import:**
- PapaParse 5.5.3 for user import via `/scripts/upsert-users-from-csv.ts`

## Environment Variables

**Required:**
- `DATABASE_URL` - SQLite for local (`file:./prisma/dev.db`) or Turso for production
- `NEXTAUTH_SECRET` - JWT signing key (secure random string)
- `NEXTAUTH_URL` - Auth base URL
- `NEXT_PUBLIC_APP_URL` - Application URL for absolute links
- `DEFAULT_ADMIN_EMAIL` - Initial admin user email
- `DEFAULT_ADMIN_NAME` - Initial admin user name

**Optional (for integrations):**
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` - Production database
- `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` / `GOOGLE_CALENDAR_REDIRECT_URI` / `GOOGLE_CALENDAR_IDS`
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_ENVIRONMENT` / `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

See `.env.example` for complete list with documentation.

## Deployment

**Build Process:**
```bash
npm run build  # Runs: prisma generate → ensure-admin-user script → next build
```

**Admin User Creation:**
- Automatically runs during build via `scripts/ensure-admin-user.ts`
- Idempotent (safe to run multiple times)
- Fallback: Call `GET /api/admin/ensure-admin` or run `npm run ensure:admin`

**Production Database:**
- **DO NOT use SQLite** - it doesn't work in serverless/Vercel
- **USE Turso** - distributed SQLite for serverless (see `TURSO_SETUP.md`)
- Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel environment variables

**Migration Strategy:**
```bash
# After deploying schema changes, run migrations:
npx prisma migrate deploy
# OR push schema directly (development only):
npx prisma db push
```

## Code Quality Standards

**Linting:**
- ESLint 8.57 with Next.js preset
- Prettier 3.3.3 (2-space indent, 80-char width, double quotes, semicolons)
- Pre-commit hooks via Husky 9.1 automatically run `lint --fix` and type checking

**Testing:**
- Vitest 2.1.0 with jsdom environment
- Setup: `__tests__/setup.ts`
- Commands: `npm test` (watch), `npm run test:ui`, `npm run test:coverage`

**Git Workflow:**
- Branch from `master`
- Pre-commit hooks run automatically (lint, type-check)
- Use conventional commit format

## Common Development Patterns

### Adding a New Feature

1. **Read existing patterns** - Look at similar features first
2. **Plan state management** - Choose Zustand (client) or TanStack Query (server)
3. **Create API routes** - Use Next.js Route Handlers in `app/api/`
4. **Add UI components** - Use shadcn/ui components from `components/ui/`
5. **Test manually** - Use `npm run dev` and test in browser
6. **Run tests** - `npm test` to ensure nothing broke

### Adding a New Database Model

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_your_change`
3. Generate client: `npm run prisma:generate`
4. Create seed script if needed in `scripts/`
5. Update this CLAUDE.md if it changes core architecture

### Adding Protected Routes

1. Place in appropriate directory (`app/dashboard/`, `app/admin/`, etc.)
2. Call `requireAuth()` or `requireAdmin()` at the top of server components
3. For API routes, validate session in route handler

### Working with Prisma

```typescript
// Always import the singleton instance
import { prisma } from "@/lib/prisma";

// Example query
const users = await prisma.user.findMany({
  where: { role: "PARTICIPANT" },
  include: { oauthAccounts: true },
});
```

## Important Notes

- **NEVER use SQLite in production** - Always use Turso for Vercel deployments
- **Admin user creation** - Happens at build time but can fail gracefully; can be run post-deployment
- **OAuth redirects** - Use dynamic base URL detection from `/lib/utils/get-base-url.ts`
- **JWT security** - Current implementation uses longer-lived tokens (7 days); consider shorter lifetime or opaque tokens
- **PayPal sandbox** - Default mode is sandbox; switch to production carefully
- **Impersonation** - Dev-only feature; disabled in production
- **Database migrations** - Must be run manually in production: `npx prisma migrate deploy`

## Project Documentation

- **Vision:** See `VISION.md` for project goals and constraints
- **AI Rules:** See `ai/` directory for detailed development guidelines
- **Turso Setup:** See `TURSO_SETUP.md` for production database setup
- **README:** See `README.md` for installation and getting started

## Tech Stack Philosophy

- Always use functional programming approaches
- Favor pure functions, immutability, function composition, declarative code
- Separate state management, UI, and side effects into different modules
- Use TDD when implementing source changes (see `ai/rules/tdd.mdc`)
- Container/presentation pattern for stateful UI components
- Never put business logic in UI components
