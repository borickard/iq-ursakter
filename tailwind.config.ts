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
      fontFamily: {
        // IQ: Neue Montreal för brödtext/etiketter/knappar, Copernicus för
        // rubriker. Ordmärket behåller sitt eget typsnitt (Syne).
        sans: ['"PP Neue Montreal"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Copernicus"', "ui-serif", "Georgia", "serif"],
        mono: ['"PP Neue Montreal"', "ui-sans-serif", "system-ui", "sans-serif"],
        wordmark: ["var(--font-syne)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Raka hörn (radius 0) som default. Rundning bara där IQ tillåter den:
        // valchips (pill) och telefonmockupen (behåller sina stora radier inline).
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // IQ har inga skuggor i vila. Kvarvarande referenser blir ingen skugga.
        soft: "none",
        raised: "none",
        float: "none",
        inset: "none",
      },
    },
  },
  plugins: [],
};

export default config;
