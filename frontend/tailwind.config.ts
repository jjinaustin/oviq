import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        // Base
        void:    "#09090b",
        surface: "#111113",
        panel:   "#18181b",
        border:  "#27272a",
        muted:   "#3f3f46",
        // Text
        dim:     "#71717a",
        body:    "#a1a1aa",
        bright:  "#f4f4f5",
        // Signal colors
        critical: "#ef4444",
        warn:     "#f59e0b",
        ok:       "#22c55e",
        info:     "#3b82f6",
        ai:       "#a78bfa",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
