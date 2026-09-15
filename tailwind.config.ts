import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Segoe UI"',
          "Aptos",
          "Calibri",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["Consolas", '"Courier New"', "Courier", "monospace"],
      },
      borderRadius: {
        card: "16px",
        control: "0.625rem",
      },
      boxShadow: {
        card: "0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
