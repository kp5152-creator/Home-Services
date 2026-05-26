export const designSystem = {
  color: {
    ink: "#17211f",
    charcoal: "#27312f",
    slate: "#5d6a64",
    sage: "#5f786c",
    sageDark: "#344b43",
    clay: "#b76e46",
    gold: "#b88a45",
    sun: "#d99a5c",
    paper: "#fbfaf7",
    sand: "#f5f2eb",
    cream: "#fffdf8",
    line: "#d9e1dc",
    danger: "#9f352e",
    successSoft: "#e7eee9",
    warningSoft: "#fff8ed",
    dangerSoft: "#fff0ed"
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px"
  },
  shadow: {
    card: "0 18px 44px rgba(35, 45, 41, 0.09)",
    lift: "0 12px 28px rgba(35, 45, 41, 0.1)",
    soft: "0 8px 20px rgba(35, 45, 41, 0.04)"
  },
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem",
    section: "2rem"
  },
  typography: {
    eyebrow: "text-xs font-extrabold uppercase tracking-[0.1em] text-clay",
    h1: "text-3xl font-extrabold leading-tight text-ink sm:text-5xl",
    h2: "text-xl font-extrabold leading-tight text-ink sm:text-2xl",
    h3: "text-lg font-extrabold leading-tight text-ink",
    body: "text-sm leading-6 text-slate-600",
    label: "text-sm font-extrabold text-ink"
  }
} as const;
