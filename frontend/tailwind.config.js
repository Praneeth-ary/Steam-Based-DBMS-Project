/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,mdx}",
    "./src/components/**/*.{js,jsx,mdx}",
    "./src/app/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        steam: {
          bg: "#1b2838",
          header: "#171a21",
          accent: "#66c0f4",
          green: "#5c7e10",
          card: "#16202d",
        },
      },
    },
  },
  plugins: [],
};
