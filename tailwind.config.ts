import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#07080d",
        foreground: "#f3f4f6",
        catalyst: {
          dark: "#0b0d14",
          surface: "#111422",
          surfaceLight: "#181d30",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.18)",
          blue: {
            DEFAULT: "#38bdf8",
            glow: "#0284c7",
            ambient: "#0369a1",
          },
          plasma: {
            blue: "#00f0ff",
            orange: "#ff5e00",
            amber: "#ff9100",
          },
          solar: {
            core: "#ffffff",
            gold: "#fbbf24",
            ray: "#f59e0b",
          },
          cosmic: {
            purple: "#a855f7",
            neon: "#c084fc",
            cyan: "#06b6d4",
          },
          singularity: {
            void: "#000000",
            prismatic: "#ec4899",
            halo: "#8b5cf6",
          },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px var(--tw-shadow-color)",
        "glow-md": "0 0 25px -4px var(--tw-shadow-color)",
        "glow-lg": "0 0 45px -5px var(--tw-shadow-color)",
        "glow-tier1": "0 0 25px -5px rgba(56, 189, 248, 0.3)",
        "glow-tier2": "0 0 30px -4px rgba(255, 94, 0, 0.35)",
        "glow-tier3": "0 0 35px -3px rgba(251, 191, 36, 0.45)",
        "glow-tier4": "0 0 40px -2px rgba(168, 85, 247, 0.5)",
        "glow-tier5": "0 0 55px 0px rgba(236, 72, 153, 0.6)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 12s linear infinite",
        "border-beam": "borderBeam 4s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        borderBeam: {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
