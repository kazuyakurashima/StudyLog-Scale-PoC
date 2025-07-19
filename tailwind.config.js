/** @type {import('tailwindcss').Config} */
const defaultConfig = require("shadcn/ui/tailwind.config")

module.exports = {
  ...defaultConfig,
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme.extend,
      fontFamily: {
        sans: ["Inter", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "sans-serif"],
      },
      animation: {
        bounce: "bounce 1s ease-in-out",
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}
