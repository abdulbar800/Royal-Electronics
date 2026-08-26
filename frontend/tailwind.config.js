/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e94560',
        secondary: '#1a1a2e',
        dark: '#16213e',
        light: '#f5f5f5'
      }
    },
  },
  plugins: [],
}