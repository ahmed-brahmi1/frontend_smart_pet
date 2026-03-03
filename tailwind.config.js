/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
        pet: { warm: '#f59e0b', cool: '#06b6d4' },
        gold: {
          DEFAULT: '#d4af37',
          light: '#d9b450',
          dark: '#af8c32',
        },
        dark: {
          main: '#363636',
          sidebar: '#2c2c2c',
          header: '#1a1a1a',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        glass: '10px',
        panel: '15px',
      },
    },
  },
  plugins: [],
};
