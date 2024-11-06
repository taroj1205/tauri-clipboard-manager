const {
  scrollbarGutter,
  scrollbarWidth,
  scrollbarColor,
} = require("tailwind-scrollbar-utilities");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(225, 11%, 14%)",
        secondary: "hsl(47, 6%, 71%)",
        active: "#3e4043",
        "active-text": "hsl(45, 4%, 63%)",
      },
    },
  },
  plugins: [scrollbarGutter(), scrollbarWidth(), scrollbarColor()],
};
