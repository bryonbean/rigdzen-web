# Providers

This directory contains React context providers for the application.

## QueryProvider

The `QueryProvider` wraps the application with TanStack Query for server state management.

It's already integrated in `app/layout.tsx` and provides:
- Query client configuration
- Default query options (staleTime, refetchOnWindowFocus)
- Query cache management

## Adding More Providers

When adding additional providers:
1. Create the provider component in this directory
2. Wrap it in `app/layout.tsx` (nest as needed)
3. Use "use client" directive for client-side providers
