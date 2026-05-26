# AGENTS.md

This file tells future AI coding agents how to work inside EstateIQ.

## Product Context

EstateIQ is a luxury home watch and property operations platform for affluent homeowners, short-term rental hosts, property managers, concierge teams, cleaners, inspectors, and vendors.

The product should feel like a trusted estate manager: calm, accurate, discreet, premium, and operationally useful. It should not feel like a generic SaaS dashboard or a robotic AI platform.

## Primary Goal

Build a simple, accurate, luxury MVP that can grow into a web-based SaaS system with:

- Admin dashboard
- Mobile inspector flow
- Homeowner portal
- Shared property profiles
- Shared inspections
- Shared photo uploads
- Shared maintenance issues
- Shared schedules/vendors
- Shared PDF report generation
- Future AI summaries and recommendations

## Working Rules

- Preserve working demo mode.
- Preserve the 3-page luxury PDF report export.
- Keep the app mobile-first.
- Keep UI calm, uncluttered, and premium.
- Do not expose or commit real client data.
- Do not make broad rewrites unless necessary.
- Prefer small, verified changes.
- Run TypeScript and production build after meaningful changes.
- When possible, verify important flows in the browser.

## Current Architecture

Use the newer folders for new work:

- `app/`: Next.js App Router pages and app shell.
- `pages/api/`: API endpoints. Keep these thin.
- `components/`: Shared UI and high-level screens.
- `components/ui/`: Reusable design-system components.
- `services/`: Database, Supabase, storage, and external service access.
- `utils/`: Shared types, checklist definitions, design tokens, and pure helpers.
- `reports/`: Demo data and PDF report generation.
- `inspections/`: Inspection-specific workflows and helpers.
- `properties/`: Property-specific workflows and helpers.
- `dashboard/`: Command-center/dashboard helpers.
- `auth/`: Future roles, auth, and permissions.
- `ai/`: Future AI feature logic.
- `hooks/`: Shared React hooks.
- `lib/`: Compatibility exports only. Prefer the new folders above for new imports.

Read `PROJECT_STRUCTURE.md` before moving major files.

## Design System Rules

Read `DESIGN_SYSTEM.md` before adding UI.

Use reusable UI components first:

- `Button` / `ButtonLink`
- `Panel`
- `Badge`
- `FieldShell`, `TextInput`, `TextArea`, `SelectInput`
- `SectionHeading`
- `StatCard`

Avoid adding long one-off Tailwind class stacks when a shared component exists.

## Demo Mode Rules

Demo mode is for live customer presentations. It must not expose real customer data and should not write demo actions into real customer records.

Protect these demo paths:

- Demo Admin
- Demo Inspector
- Demo Homeowner
- Demo property: Cielo Vista Estate
- Demo report: `/reports/demo-inspection-home-watch`
- Demo PDF: `/api/reports/demo-inspection-home-watch`

The demo report should remain polished, fast, and reliable.

## PWA Rules

The service worker must not cache Next.js runtime assets from `/_next/` or API responses from `/api/`. Stale cached app bundles can break client-side buttons after deployments.

When changing PWA behavior, test the app after a fresh production build.

## Database/Data Rules

- Supabase is the intended production database.
- Local JSON is still used for early local/demo workflows.
- Avoid committing real customer data from `data/db.json`.
- Keep shared models in `utils/types.ts`.
- Keep database access in `services/database.ts`.

## Report Rules

PDF generation belongs in `reports/pdfReport.ts`.

The homeowner PDF should feel:

- concise
- polished
- trustworthy
- homeowner-friendly
- not overloaded

Current target: 3 pages.

Do not make reports long unless the user asks for a detailed appendix.

## AI Feature Rules

Read `AI_OPERATING_MANUAL.md` before adding AI features.

AI should support the human operator, not replace judgment. AI-generated text must feel like a concierge/estate manager wrote it, not a chatbot.

## Verification Checklist

After meaningful changes, run:

- TypeScript check
- Production build
- Browser check for the changed page
- PDF export check if report logic changed
- Demo mode check if login/demo/PWA/client code changed

## Git/Deployment Notes

The user usually pushes through GitHub Desktop because terminal Git auth has been difficult. Do not assume terminal push works.

Mention if `data/db.json` is modified so it is not accidentally committed with real/test customer data.
