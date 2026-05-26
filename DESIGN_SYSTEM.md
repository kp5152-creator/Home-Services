# EstateIQ Design System

EstateIQ should feel simple, accurate, and luxurious: Apple-level clarity with a Four Seasons / estate-management tone.

## Color System

Use warm neutrals, soft black, sage, clay, and restrained gold. Avoid loud gradients or bright SaaS colors.

- Ink: primary text and dark panels.
- Charcoal/slate: supporting text.
- Paper/sand/cream: page and card surfaces.
- Sage/sage-dark: trusted action color.
- Clay/gold: premium accents, eyebrows, dividers, and report details.
- Danger: urgent issue states only.

Core tokens live in `app/globals.css`, `tailwind.config.ts`, and `utils/designSystem.ts`.

## Typography System

- H1: screen-level title only.
- H2: panel and page section titles.
- H3: card-level title.
- Eyebrow: small uppercase clay/gold label.
- Body: calm, readable 14px-16px text with generous line height.
- Labels: bold and short.

Do not use oversized hero text inside compact panels or forms.

## Spacing System

Use a compact 4px/8px rhythm:

- xs: 8px
- sm: 12px
- md: 16px
- lg: 20px
- xl: 24px
- section: 32px

Mobile pages should feel focused: fewer stacked panels, clear actions, and no repeated content.

## Button Styles

Use `Button` and `ButtonLink` from `components/ui`.

- Primary: main save/continue/export action.
- Soft: secondary navigation and low-risk actions.
- Ghost: quiet utility action.
- Danger: destructive actions only.

Buttons should be at least 44px tall on mobile.

## Card Styles

Use `Panel` and `StatCard` from `components/ui`.

- Panels use 8px radius by default.
- Cards should not be nested inside decorative cards.
- Use shadows lightly; report/product surfaces should stay clean and professional.

## Form Standards

Use `FieldShell`, `TextInput`, `TextArea`, and `SelectInput` from `components/ui`.

- Labels are short and bold.
- Inputs are 48px tall where possible.
- Focus state uses sage ring.
- Help text is small, calm, and only used when useful.

## Implementation Rule

New screens should use reusable UI components before adding raw Tailwind class stacks. If a pattern repeats three times, promote it into `components/ui`.
