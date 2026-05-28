import { designTokens } from "./designTokens";

export const designSystem = {
  color: {
    ink: designTokens.color.brand.ink,
    charcoal: designTokens.color.brand.charcoal,
    slate: designTokens.color.brand.slate,
    sage: designTokens.color.brand.sage,
    sageDark: designTokens.color.brand.sageDark,
    clay: designTokens.color.brand.clay,
    gold: designTokens.color.brand.gold,
    sun: designTokens.color.brand.sun,
    paper: designTokens.color.surface.paper,
    sand: designTokens.color.surface.page,
    cream: designTokens.color.surface.cream,
    line: designTokens.color.border.line,
    danger: designTokens.color.state.danger,
    successSoft: designTokens.color.state.successSoft,
    warningSoft: designTokens.color.state.warningSoft,
    dangerSoft: designTokens.color.state.dangerSoft
  },
  radius: designTokens.radius,
  shadow: {
    card: designTokens.shadow.card,
    lift: designTokens.shadow.lift,
    soft: designTokens.shadow.soft
  },
  spacing: {
    xs: designTokens.spacing.xs,
    sm: designTokens.spacing.sm,
    md: designTokens.spacing.md,
    lg: designTokens.spacing.lg,
    xl: designTokens.spacing.xl,
    section: designTokens.spacing.section
  },
  typography: {
    eyebrow: "text-xs font-extrabold uppercase tracking-[0.1em] text-clay",
    h1: "font-serif text-4xl font-semibold leading-tight text-ink sm:text-6xl",
    h2: "font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl",
    h3: "font-serif text-xl font-semibold leading-tight text-ink",
    body: "text-sm leading-6 text-muted",
    label: "text-sm font-extrabold text-ink"
  },
  animation: designTokens.animation
} as const;

export { designTokens };
