/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f3f6fa', 100: '#e3e9f2', 300: '#8ba0c1', 500: '#2f4d75', 700: '#1c3252', 900: '#12213a' },
        amber: { 50: '#fdf6ea', 100: '#faecd2', 300: '#eec277', 500: '#e0a13a', 600: '#c07f1f', 700: '#96631a' },
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
