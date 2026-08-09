/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef2f7', 100: '#d7e1ec', 300: '#7f97b5', 500: '#2c4566', 700: '#1a2c44', 900: '#101d30' },
        amber: { 50: '#fdf6ea', 100: '#f9e6c1', 300: '#eec277', 500: '#dc9c34', 600: '#c07f1f', 700: '#96631a' },
        canvas: '#f5f6f8',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,29,48,0.04), 0 1px 8px rgba(16,29,48,0.05)',
        card: '0 2px 6px rgba(16,29,48,0.06), 0 8px 24px rgba(16,29,48,0.05)',
      },
    },
  },
  plugins: [],
}
