import type { Config } from "tailwindcss";
import { designTokens } from "./utils/designTokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./reports/**/*.{ts,tsx}",
    "./inspections/**/*.{ts,tsx}",
    "./properties/**/*.{ts,tsx}",
    "./dashboard/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: designTokens.color.brand.ink,
        charcoal: designTokens.color.brand.charcoal,
        slate: designTokens.color.brand.slate,
        clay: designTokens.color.brand.clay,
        gold: designTokens.color.brand.gold,
        sun: designTokens.color.brand.sun,
        sage: designTokens.color.brand.sage,
        "sage-dark": designTokens.color.brand.sageDark,
        paper: designTokens.color.surface.paper,
        sand: designTokens.color.surface.page,
        cream: designTokens.color.surface.cream,
        line: designTokens.color.border.line,
        danger: designTokens.color.state.danger,
        "success-soft": designTokens.color.state.successSoft,
        "warning-soft": designTokens.color.state.warningSoft,
        "danger-soft": designTokens.color.state.dangerSoft
      },
      borderRadius: {
        estate: designTokens.radius.md,
        "estate-lg": designTokens.radius.lg,
        "estate-xl": designTokens.radius.xl
      },
      boxShadow: {
        estate: designTokens.shadow.card,
        lift: designTokens.shadow.lift,
        soft: designTokens.shadow.soft,
        modal: designTokens.shadow.modal,
        button: designTokens.shadow.button
      },
      spacing: {
        "estate-xs": designTokens.spacing.xs,
        "estate-sm": designTokens.spacing.sm,
        "estate-md": designTokens.spacing.md,
        "estate-lg": designTokens.spacing.lg,
        "estate-xl": designTokens.spacing.xl,
        "estate-section": designTokens.spacing.section,
        "estate-page": designTokens.spacing.page
      },
      fontSize: {
        eyebrow: [
          designTokens.typography.size.eyebrow,
          {
            lineHeight: "1rem",
            letterSpacing: designTokens.typography.tracking.eyebrow,
            fontWeight: designTokens.typography.weight.extraBold
          }
        ],
        label: [
          designTokens.typography.size.label,
          {
            lineHeight: "1.25rem",
            fontWeight: designTokens.typography.weight.extraBold
          }
        ]
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans.split(", "),
        serif: designTokens.typography.fontFamily.display.split(", ")
      },
      transitionDuration: {
        fast: designTokens.animation.duration.fast,
        base: designTokens.animation.duration.base,
        slow: designTokens.animation.duration.slow
      },
      transitionTimingFunction: {
        estate: designTokens.animation.easing.standard,
        "estate-out": designTokens.animation.easing.entrance
      }
    }
  },
  plugins: []
};

export default config;
