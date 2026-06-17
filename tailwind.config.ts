import type { Config } from "tailwindcss"

// AINameGenius Design System V1 — color tokens
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ang: {
          // Primary palette
          primary: "#6367FF",   // CTA, active links, score badges
          secondary: "#8494FF", // Hover states, iconography
          lavender: "#C9BEFF",  // Secondary backgrounds, chips
          pink: "#FFDBFD",      // Illustrations, empty states, onboarding

          // Neutral palette
          navy: "#0B0E19",      // Main dark background, hero
          slate: "#151827",     // Dark cards, level-1 surfaces
          charcoal: "#1F2433",  // Inputs, tables, level-2 surfaces
          mist: "#F2F1FF",      // Light background, docs

          // Semantic
          success: "#6FCF97",   // Available domain, OK check
          warning: "#FFCF95",   // Partial availability, caution
          danger: "#F48F68",    // Taken domain, conflict, error
          info: "#8494FF",      // In-progress, AI suggestion
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["64px", { lineHeight: "72px", fontWeight: "700" }],
        h1: ["56px", { lineHeight: "64px", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "44px", fontWeight: "600" }],
        h3: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        btn: ["14px", { lineHeight: "20px", fontWeight: "600" }],
        overline: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,.25)",
        md: "0 4px 12px rgba(0,0,0,.35)",
        lg: "0 12px 30px rgba(0,0,0,.45)",
      },
      maxWidth: {
        layout: "1280px",
      },
    },
  },
  plugins: [],
}

export default config
