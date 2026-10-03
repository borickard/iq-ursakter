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
        // Platta, neutrala skuggor (inga färgade gradient-skuggor längre).
        soft: "0 1px 2px rgba(17,24,39,0.06), 0 6px 16px -8px rgba(17,24,39,0.10)",
        raised: "0 1px 2px rgba(17,24,39,0.08), 0 8px 20px -8px rgba(17,24,39,0.14)",
        inset: "inset 0 1px 2px rgba(17,24,39,0.06)",
        float: "0 12px 32px -10px rgba(17,24,39,0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
