/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
 extend: {
      fontFamily: {
        primary: ['Montserrat', 'sans-serif'], // Primary
        secondary: ['Calibri', 'sans-serif'],  // Secondary
      },
    },
  },
  plugins: [],
}

