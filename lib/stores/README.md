# State Management

This directory contains Zustand stores for client-side state management.

## Structure

- Each store should be in its own file
- Keep stores focused and scoped to specific domains
- Prefer multiple small stores over one large store

## Usage Example

```typescript
// lib/stores/example-store.ts
import { create } from "zustand";

interface ExampleState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

## Server State

For server state (API data, async data), use TanStack Query in `lib/queries/` or `lib/hooks/`.
