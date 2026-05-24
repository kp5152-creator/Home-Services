import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        clay: "#b76e46",
        sun: "#d99a5c",
        sage: "#5f786c",
        "sage-dark": "#344b43",
        paper: "#fbfaf7",
        sand: "#f5f2eb",
        line: "#d9e1dc"
      },
      boxShadow: {
        estate: "0 18px 44px rgba(35, 45, 41, 0.09)",
        lift: "0 12px 28px rgba(35, 45, 41, 0.1)"
      }
    }
  },
  plugins: []
};

export default config;
