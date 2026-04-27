import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ig: {
          bg: "#000000",
          surface: "#000000",
          card: "#000000",
          border: "#262626",
          mutedBorder: "#363636",
          text: "#FAFAFA",
          subtle: "#A8A8A8",
          link: "#E0F1FF",
          primary: "#0095F6",
          primaryHover: "#1877F2",
          danger: "#ED4956",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        brand: ['"Grand Hotel"', '"Billabong"', "cursive"],
      },
      animation: {
        "story-ring": "spin 3s linear infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
        "scale-in": "scaleIn 0.15s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "heart-pop": "heartPop 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        heartPop: {
          "0%": { opacity: "0", transform: "scale(0)" },
          "15%": { opacity: "0.9", transform: "scale(1.2)" },
          "30%": { transform: "scale(0.95)" },
          "45%, 80%": { opacity: "0.9", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
