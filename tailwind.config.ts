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
        sans: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-archivo)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "monospace"],
        wordmark: ["var(--font-syne)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // Hårda offset-skuggor (brutalist). Inget suddigt.
        soft: "3px 3px 0 #0b0b0b",
        raised: "4px 4px 0 #0b0b0b",
        float: "6px 6px 0 #0b0b0b",
        inset: "none",
      },
    },
  },
  plugins: [],
};

export default config;
