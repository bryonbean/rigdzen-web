# Rigdzen Web

A web application designed to support Buddhist retreat coordination and sangha community management. The platform serves as a companion to the Rigdzen mobile app, providing comprehensive administrative capabilities for retreat organizers while offering participants streamlined access to retreat services, schedules, and spiritual practice tracking.

## Overview

Rigdzen addresses the logistical challenges of coordinating multi-day retreats for 20-40 participants, managing meal orders, tracking practice accumulations (Ngondro, Green Tara, and Vajrasattva), and facilitating community communication. Built for organizations like Orgyen Khamdroling and OKL Canada, Rigdzen transforms retreat coordination from ad-hoc coordination into a structured, scalable system.

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:**
  - Zustand (client state)
  - TanStack Query (server state)
  - Redux-saga (complex side effects)
- **Database:** Prisma ORM with SQLite (development) / Turso (production)
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint + Prettier
- **Git Hooks:** Husky with pre-commit hooks

## Prerequisites

- **Node.js:** 20.18.2 or higher (LTS recommended)
- **Yarn:** 1.22.19 or higher
- **Git:** Latest version

## Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:bryonbean/rigdzen-web.git
   cd rigdzen-web
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your actual values (see [Environment Variables](#environment-variables) section).

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   yarn prisma:generate

   # Run database migrations (when ready)
   yarn prisma:migrate
   ```

5. **Start the development server:**
   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required (Development)

- `DATABASE_URL` - SQLite database path (e.g., `file:./prisma/dev.db`)

### Required (Production)

- `TURSO_DATABASE_URL` - Turso database URL (e.g., `libsql://database-name.turso.io`)
- `TURSO_AUTH_TOKEN` - Turso authentication token
- `DEFAULT_ADMIN_EMAIL` - Admin user email
- `DEFAULT_ADMIN_NAME` - Admin user name
- `NEXTAUTH_SECRET` - Secure random string for JWT signing

### Optional (for integrations)

- `PAYPAL_CLIENT_ID` - PayPal Client ID for payment processing
- `PAYPAL_CLIENT_SECRET` - PayPal Client Secret
- `PAYPAL_ENVIRONMENT` - `sandbox` or `production`
- `GOOGLE_CALENDAR_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CALENDAR_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_CALENDAR_REDIRECT_URI` - OAuth callback URL
- `GOOGLE_CALENDAR_IDS` - Comma-separated calendar IDs to aggregate

See `.env.example` for a complete list with documentation.

## Available Scripts

### Development

- `yarn dev` - Start development server on [http://localhost:3000](http://localhost:3000)
- `yarn build` - Build the application for production
- `yarn start` - Start the production server (after `yarn build`)

### Code Quality

- `yarn lint` - Run ESLint and fix auto-fixable issues
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check code formatting without making changes

### Testing

- `yarn test` - Run tests in watch mode
- `yarn test:ui` - Run tests with Vitest UI
- `yarn test:coverage` - Run tests with coverage report

### Database

- `yarn prisma:generate` - Generate Prisma Client
- `yarn prisma:migrate` - Run database migrations
- `yarn prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
rigdzen-web/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                  # Utility functions and configurations
│   ├── prisma.ts         # Prisma Client singleton
│   ├── providers/        # React context providers
│   ├── stores/           # Zustand stores
│   └── utils.ts          # Utility functions
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
├── __tests__/            # Test files
│   ├── setup.ts          # Test setup
│   └── lib/              # Test files organized by module
├── .husky/               # Git hooks
│   └── pre-commit        # Pre-commit hook
├── public/               # Static assets
└── ai/                   # AI agent rules and commands
```

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the ESLint configuration (run `yarn lint` before committing)
- Format code with Prettier (run `yarn format` before committing)
- Use functional programming approaches where possible
- Prefer `const` over `let` and `var`

### State Management

- **Client State:** Use Zustand stores in `lib/stores/`
- **Server State:** Use TanStack Query hooks for API data
- **Side Effects:** Use redux-saga for complex orchestration when needed

### Component Structure

- Use the container/presentation pattern when you need persisted state
- Containers should never contain direct UI markup
- Business logic should be in separate modules, not in components

### Testing

- Write tests for utility functions and components
- Use React Testing Library for component testing
- Tests should be in `__tests__/` directory mirroring source structure

### Git Workflow

- Pre-commit hooks automatically run:
  - `yarn lint --fix` - Lint and auto-fix code
  - `yarn tsc --noEmit` - Type checking
- Commit messages should follow conventional commit format

## Database

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. After making changes:

```bash
# Create a new migration
yarn prisma:migrate

# Generate Prisma Client
yarn prisma:generate
```

### Prisma Client Usage

```typescript
import { prisma } from "@/lib/prisma";

// Example query
const users = await prisma.user.findMany();
```

## Testing

Tests are written using Vitest and React Testing Library. Run tests with:

```bash
# Watch mode
yarn test

# UI mode
yarn test:ui

# Coverage report
yarn test:coverage
```

## Deployment

**Important:** SQLite does not work in serverless environments like Vercel. You must use Turso for production deployments.

### Production Deployment to Vercel

1. **Set up Turso database:**
   ```bash
   # Create database
   turso db create rigdzen-production

   # Get auth token
   turso db tokens create rigdzen-production
   ```

2. **Configure Vercel environment variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add required variables (see `.env.example` for complete list)
   - Critical variables:
     - `TURSO_DATABASE_URL` - Your Turso database URL
     - `TURSO_AUTH_TOKEN` - Your Turso auth token
     - `DEFAULT_ADMIN_EMAIL` - Admin user email
     - `DEFAULT_ADMIN_NAME` - Admin user name
     - `NEXTAUTH_SECRET` - Secure random string
     - Other integration variables (PayPal, Google, etc.)

3. **Deploy to Vercel:**
   ```bash
   # Using Vercel CLI
   vercel --prod

   # Or push to your git branch and Vercel will auto-deploy
   ```

4. **Run database migrations:**
   ```bash
   # Set Turso variables in your local environment temporarily
   export TURSO_DATABASE_URL="your-turso-url"
   export TURSO_AUTH_TOKEN="your-auth-token"

   # Run migrations
   npx prisma migrate deploy
   ```

For detailed Turso setup instructions, see `TURSO_SETUP.md`.

## Contributing

1. Create a new branch from `master`
2. Make your changes following the development guidelines
3. Run tests and ensure all checks pass
4. Commit your changes (pre-commit hooks will run automatically)
5. Push your branch and create a pull request

## Documentation

- **Vision Document:** See `VISION.md` for project goals and constraints
- **AI Agent Rules:** See `ai/` directory for development guidelines and agent rules
- **Stack Configuration:** See `.cursor/rules/stack.mdc` for tech stack details

## License

[Add license information here]

## Support

[Add support/contact information here]
