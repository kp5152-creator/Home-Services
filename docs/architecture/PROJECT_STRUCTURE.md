# EstateIQ Project Structure

EstateIQ now uses a clearer structure so the same codebase can grow into an admin dashboard, mobile inspector flow, homeowner portal, reports, and AI features.

- `app/`: Next.js App Router pages and global app shell.
- `pages/api/`: API endpoints that receive web requests. Keep these thin and delegate business logic to feature/service folders.
- `components/`: Shared UI components used across screens.
- `services/`: Data access and external service clients, including database and Supabase helpers.
- `utils/`: Shared types, checklist definitions, and small pure helpers.
- `reports/`: Demo report data and PDF report generation.
- `inspections/`: Inspection-specific exports and future inspection workflows.
- `properties/`: Property-specific models, forms, and future property workflows.
- `dashboard/`: Dashboard/operations-specific helpers and future command-center modules.
- `auth/`: Future authentication, roles, and permissions.
- `ai/`: Rules-assisted Co-Pilot helpers, maintenance recommendations, shared AI types/prompts, and future provider-backed AI features.
- `hooks/`: Shared React hooks as the UI is split into smaller modules.
- `lib/`: Compatibility exports for older imports. New code should prefer `services/`, `utils/`, and feature folders.
