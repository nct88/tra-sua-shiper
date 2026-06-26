import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        boba: {
          50: "#fdf6f0",
          100: "#f8e7d8",
          200: "#eecbb0",
          300: "#e0a87f",
          400: "#d2854f",
          500: "#c06a34",
          600: "#a4532a",
          700: "#834024",
          800: "#6a3522",
          900: "#572d20",
        },
      },
    },
  },
  plugins: [],
};

export default config;
