export const designTokens = {
  color: {
    brand: {
      ink: "#1F1F1F",
      charcoal: "#252525",
      slate: "#D8D0C2",
      sage: "#C9A227",
      sageDark: "#D4AF37",
      clay: "#D4AF37",
      gold: "#D4AF37",
      sun: "#F2D98A"
    },
    surface: {
      page: "#1F1F1F",
      paper: "#252525",
      cream: "#F5F2EA",
      white: "#ffffff",
      panel: "rgba(245, 242, 234, 0.92)"
    },
    border: {
      line: "rgba(212, 175, 55, 0.22)",
      lineStrong: "rgba(212, 175, 55, 0.42)",
      warm: "#E5C76B"
    },
    state: {
      danger: "#9f352e",
      dangerSoft: "#fff0ed",
      warning: "#8A6A18",
      warningSoft: "#EAE4D8",
      success: "#6F742D",
      successSoft: "#F0E8C8"
    },
    dark: {
      ink: "#121212",
      panel: "rgba(37, 37, 37, 0.88)",
      text: "#f8f4eb",
      muted: "rgba(248, 244, 235, 0.68)",
      line: "rgba(248, 244, 235, 0.12)"
    }
  },
  typography: {
    fontFamily: {
      sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      display: "Cormorant Garamond, Playfair Display, Georgia, Times New Roman, serif"
    },
    size: {
      eyebrow: "0.75rem",
      label: "0.875rem",
      bodySm: "0.875rem",
      body: "1rem",
      h3: "1.125rem",
      h2: "1.5rem",
      h1: "2.25rem"
    },
    lineHeight: {
      tight: "1.12",
      snug: "1.25",
      body: "1.5",
      relaxed: "1.7"
    },
    weight: {
      medium: "500",
      semibold: "600",
      bold: "700",
      extraBold: "800",
      black: "900"
    },
    tracking: {
      normal: "0",
      eyebrow: "0.1em",
      wide: "0.12em"
    }
  },
  spacing: {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem",
    section: "2rem",
    page: "clamp(1rem, 2vw, 2rem)"
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    pill: "999px"
  },
  shadow: {
    card: "0 24px 70px rgba(0, 0, 0, 0.28)",
    lift: "0 16px 38px rgba(0, 0, 0, 0.22)",
    soft: "0 10px 26px rgba(0, 0, 0, 0.14)",
    modal: "0 30px 90px rgba(0, 0, 0, 0.42)",
    button: "0 14px 30px rgba(212, 175, 55, 0.26)"
  },
  animation: {
    duration: {
      fast: "140ms",
      base: "160ms",
      slow: "240ms"
    },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      entrance: "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    transition: {
      interactive:
        "transform 140ms cubic-bezier(0.2, 0, 0, 1), box-shadow 160ms cubic-bezier(0.2, 0, 0, 1), background 160ms cubic-bezier(0.2, 0, 0, 1), border-color 160ms cubic-bezier(0.2, 0, 0, 1)",
      focus: "border-color 160ms cubic-bezier(0.2, 0, 0, 1), box-shadow 160ms cubic-bezier(0.2, 0, 0, 1)"
    }
  }
} as const;

export type DesignTokens = typeof designTokens;
