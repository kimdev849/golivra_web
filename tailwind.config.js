/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // GoLivra brand — vert profond comme golivra_mobile
        brand: {
          50: "#EAF4EE",
          100: "#D6E6DC",
          200: "#B8D9C8",
          300: "#8FC4AA",
          400: "#5EAA85",
          500: "#0B6B45",
          600: "#0A5E3C",
          700: "#0C4F36",
          800: "#083E2A",
          900: "#062A1B",
          DEFAULT: "#0B6B45",
        },
        // Accent jaune/orange du logo
        accent: {
          50: "#FFF5E0",
          100: "#FFE8B8",
          200: "#FFD78A",
          300: "#FFC96B",
          400: "#FFB940",
          500: "#F5A524",
          600: "#E89A1C",
          700: "#D27A09",
          800: "#B56608",
          900: "#8A4E06",
          DEFAULT: "#F5A524",
        },
        onAccent: "#1A1A1A",
        // Surface / background
        surface: "#FFFFFF",
        "surface-muted": "#F6FAF7",
        "surface-alt": "#F4F6F5",
        // Text
        "txt": "#11181C",
        "txt-secondary": "#355245",
        "txt-muted": "#6A8578",
        // Borders
        "line": "#E8F2EC",
        "line-strong": "#D6E6DC",
        // Error
        error: "#B42318",
        "error-soft": "#FEF3F2",
        // Success
        success: "#0B6B45",
        "success-soft": "#ECFDF3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
