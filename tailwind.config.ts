import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand is black + metallic gold (from the crest logo). "cancha"
        // tokens are kept as the warm near-black surface scale so existing
        // class names stay valid.
        cancha: {
          DEFAULT: "#1C1A16", // warm charcoal — cards / bars
          dark: "#0E0C0A", // near-black — page background
        },
        gold: {
          DEFAULT: "#E7B53C", // metallic gold
          bright: "#F8D777", // highlight (top of the metallic gradient)
          dark: "#9C6B1C", // bronze (bottom of the gradient)
        },
        burgundy: "#5C1A24", // deep oxblood accent (sparingly)
        cream: "#F3EAD7", // warm ivory text
        ink: "#070605", // deepest black
        live: "#E5484D",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        pulseLive: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        pulseLive: "pulseLive 1.2s ease-in-out infinite",
        ticker: "ticker 60s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
