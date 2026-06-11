import type { Config } from "tailwindcss";

/**
 * Tema-färgerna kommer från CSS-variabler (se globals.css) så att hela
 * uttrycket kan tematiseras sent – t.ex. om IQ-kopplingen ska tonas upp/ner.
 * Ändra variablerna, inte komponenterna.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--color-surface-2) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        "brand-fg": "rgb(var(--color-brand-fg) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // Mjukt djup under kort/fält – ger den lyfta känslan i referensbilden.
        soft: "0 14px 34px -14px rgba(193, 53, 96, 0.40)",
        // Upphöjd knapp: skugga nedåt + ljus highlight i överkant.
        raised:
          "0 10px 22px -8px rgba(193, 53, 96, 0.50), inset 0 1px 0 0 rgba(255, 255, 255, 0.40)",
        // Insänkt fält (mjuk inre skugga).
        inset: "inset 0 2px 7px rgba(193, 53, 96, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
