/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#202238",
        muted: "#85869a",
        canvas: "#f7f8fc",
        violet: {
          50: "#f1efff",
          100: "#e6e2ff",
          500: "#7565e8",
          600: "#6554d8",
          700: "#5545c1",
        },
      },
      boxShadow: {
        soft: "0 8px 30px rgba(36, 35, 68, 0.055)",
      },
    },
  },
  plugins: [],
};
