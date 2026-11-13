/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#1d1d1f', mist: '#F5F5F7', brand: { 50: '#eaf4ff', 100: '#d8ecff', 500: '#0077ed', 600: '#0071e3', 700: '#005bb5' } },
      boxShadow: { card: '0 4px 20px -2px rgb(0 0 0 / .04), 0 1px 3px rgb(0 0 0 / .03)' },
    },
  },
  plugins: [],
};
