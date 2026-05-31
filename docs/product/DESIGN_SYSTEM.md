# EstateIQ Design System

EstateIQ should feel simple, accurate, and luxurious: Apple-level clarity with a Four Seasons / estate-management tone. The master visual reference is the gold EstateIQ logo: charcoal, warm gold, and refined sand.

## Color System

Use charcoal, warm sand, and restrained metallic gold. Avoid loud gradients, bright SaaS colors, and generic corporate blues.

- Ink/charcoal: primary app background and dark panels.
- Warm sand/cream: card surfaces and readable report pages.
- Gold: trusted action color, premium accents, active states, icons, dividers, and report details.
- Danger: urgent issue states only.

Core tokens live in `utils/designTokens.ts`. Tailwind reads from that file through `tailwind.config.ts`, CSS variables are mirrored in `app/globals.css`, and compatibility helpers are exported from `utils/designSystem.ts`.

## Typography System

- H1: screen-level title only.
- H2: panel and page section titles.
- H3: card-level title.
- Eyebrow: small uppercase gold label.
- Body: calm, readable 14px-16px text with generous line height.
- Labels: bold and short.

Do not use oversized hero text inside compact panels or forms.

Typography tokens cover:

- font families
- type sizes
- line heights
- weights
- letter spacing

## Spacing System

Use a compact 4px/8px rhythm:

- xs: 8px
- sm: 12px
- md: 16px
- lg: 20px
- xl: 24px
- section: 32px

Mobile pages should feel focused: fewer stacked panels, clear actions, and no repeated content.

Spacing tokens should be used before one-off values when creating new shared UI patterns.

## Motion System

Use subtle motion only. EstateIQ should feel polished, not busy.

- Fast: small hover and press response.
- Base: border, focus, and background transitions.
- Slow: modal or sheet entrance only.
- Standard easing: calm UI state changes.
- Entrance easing: polished modal/sheet appearance.

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
- Focus state uses a restrained gold ring.
- Help text is small, calm, and only used when useful.

## Implementation Rule

New screens should use reusable UI components before adding raw Tailwind class stacks. If a pattern repeats three times, promote it into `components/ui`.
