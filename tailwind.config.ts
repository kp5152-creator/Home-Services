import type { Config } from "tailwindcss";

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
        ink: "#17211f",
        charcoal: "#27312f",
        slate: "#5d6a64",
        clay: "#b76e46",
        gold: "#b88a45",
        sun: "#d99a5c",
        sage: "#5f786c",
        "sage-dark": "#344b43",
        paper: "#fbfaf7",
        sand: "#f5f2eb",
        cream: "#fffdf8",
        line: "#d9e1dc",
        danger: "#9f352e",
        "success-soft": "#e7eee9",
        "warning-soft": "#fff8ed",
        "danger-soft": "#fff0ed"
      },
      borderRadius: {
        estate: "8px",
        "estate-lg": "12px",
        "estate-xl": "16px"
      },
      boxShadow: {
        estate: "0 18px 44px rgba(35, 45, 41, 0.09)",
        lift: "0 12px 28px rgba(35, 45, 41, 0.1)",
        soft: "0 8px 20px rgba(35, 45, 41, 0.04)"
      },
      spacing: {
        "estate-xs": "0.5rem",
        "estate-sm": "0.75rem",
        "estate-md": "1rem",
        "estate-lg": "1.25rem",
        "estate-xl": "1.5rem",
        "estate-section": "2rem"
      },
      fontSize: {
        eyebrow: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.1em", fontWeight: "800" }],
        label: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "800" }]
      }
    }
  },
  plugins: []
};

export default config;
