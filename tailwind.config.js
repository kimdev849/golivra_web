/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // GoLivra brand — CSS vars for automatic dark mode
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "#B8D9C8",
          300: "#8FC4AA",
          400: "#5EAA85",
          500: "var(--brand)",
          600: "#0A5E3C",
          700: "var(--brand-deep)",
          800: "#083E2A",
          900: "#062A1B",
          DEFAULT: "var(--brand)",
        },
        // Accent jaune/orange du logo
        accent: {
          50: "#FFF5E0",
          100: "#FFE8B8",
          200: "#FFD78A",
          300: "#FFC96B",
          400: "var(--accent)",
          500: "var(--accent)",
          600: "var(--accent-deep)",
          700: "var(--accent-deep)",
          800: "#B56608",
          900: "#8A4E06",
          DEFAULT: "var(--accent)",
        },
        onAccent: "#1A1A1A",
        // Surface / background — use CSS vars so dark mode works automatically
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        "surface-alt": "var(--bg-alt)",
        // Text
        "txt": "var(--txt)",
        "txt-secondary": "var(--txt-secondary)",
        "txt-muted": "var(--txt-muted)",
        // Borders
        "line": "var(--border)",
        "line-strong": "var(--border-strong)",
        // Error
        error: "var(--error)",
        "error-soft": "var(--error-soft)",
        // Success
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
