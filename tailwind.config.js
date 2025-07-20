/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN', 
          'Noto Sans JP',
          'sans-serif'
        ]
      },
      animation: {
        bounce: 'bounce 1s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}