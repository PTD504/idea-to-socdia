import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "creative-paper": "#F8FAFC",
        "glass-white": "rgba(255, 255, 255, 0.7)",
        "deep-black": "#0A0A0A",
        "soft-gray": "#64748B",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
        "gradient-accent": "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
        "gradient-shimmer": "linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
