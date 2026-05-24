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
        wine: {
          50: '#fcf3f6',
          100: '#fae8ee',
          200: '#f5d5df',
          300: '#ebb3c5',
          400: '#db87a2',
          500: '#c55e81',
          600: '#a94164',
          700: '#8b1e3f', // Bookella Primary Wine
          800: '#751b37',
          900: '#641a31',
        },
        gold: {
          50: '#fefbec',
          100: '#fdf4cf',
          200: '#fae79d',
          300: '#f7d360',
          400: '#f4ba31',
          500: '#e59f14',
          600: '#d4af37', // Bookella Secondary Gold
          700: '#a37711',
          800: '#855e13',
          900: '#714e14',
        }
      },
    },
  },
  plugins: [],
};
