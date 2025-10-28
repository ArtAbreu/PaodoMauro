import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", ...fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: "#f97316",
          dark: "#c2410c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
