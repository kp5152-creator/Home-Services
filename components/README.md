# Components

Shared, reusable UI components live here. Large feature screens should gradually move into feature folders.

## Route State Components

- `RouteRecovery.tsx`: Branded EstateIQ recovery UI for App Router `error.tsx` files.
- `RouteLoading.tsx`: Branded EstateIQ loading UI for App Router `loading.tsx` files.

Use these instead of raw route-specific error/loading markup so app, report, and future portal routes keep a consistent luxury fallback experience.
