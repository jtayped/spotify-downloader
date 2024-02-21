/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#1DB954",
        primary: "#191414",
        secondary: "#212121",
        text: "#FFF",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
