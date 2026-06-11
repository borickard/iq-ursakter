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
        // Djup mjuk skugga under kort/fält + en svag ljus topp-kant (upphöjt).
        soft: "0 24px 48px -16px rgba(186, 50, 95, 0.48), 0 8px 18px -10px rgba(186, 50, 95, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
        // Extruderad knapp/badge: djup skugga + tät kontaktskugga + inre highlight.
        raised:
          "0 18px 36px -10px rgba(186, 50, 95, 0.58), 0 5px 12px -4px rgba(170, 40, 80, 0.45), inset 0 2px 1px rgba(255, 255, 255, 0.55), inset 0 -4px 8px rgba(150, 30, 70, 0.28)",
        // Insänkt (recessed) fält – tydlig inre skugga.
        inset:
          "inset 0 3px 8px rgba(186, 50, 95, 0.22), inset 0 -1px 1px rgba(255, 255, 255, 0.7)",
        // Stor svävande badge.
        float:
          "0 30px 55px -12px rgba(170, 40, 80, 0.6), 0 12px 22px -8px rgba(186, 50, 95, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
