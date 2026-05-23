import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        clay: "#b76e46",
        sage: "#6e8478",
        "sage-dark": "#40584d",
        paper: "#fbfaf7",
        line: "#dbe2dd"
      },
      boxShadow: {
        estate: "0 24px 60px rgba(35, 45, 41, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
