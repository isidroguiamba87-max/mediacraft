import type { Config } from "tailwindcss";

/**
 * Tailwind theme mapping. Together with styles/tokens.css this is the
 * other file to touch for a visual overhaul: colors/radii/shadows below
 * simply point at the CSS variables defined in tokens.css, and font
 * families point at the same token file's --font-display / --font-body.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "var(--brand-red)",
          "red-deep": "var(--brand-red-deep)",
          navy: "var(--brand-navy)",
          "navy-2": "var(--brand-navy-2)",
        },
        ink: "var(--ink)",
        slate: "var(--slate)",
        paper: {
          DEFAULT: "var(--paper)",
          2: "var(--paper-2)",
        },
        line: "var(--line)",
        success: "var(--success)",
        alert: "var(--alert)",
      },
      borderRadius: {
        brand: "var(--radius)",
      },
      boxShadow: {
        brand: "var(--shadow)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1480px",
      },
    },
  },
  plugins: [],
};

export default config;
