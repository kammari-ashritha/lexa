/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mongo: {
          green: '#00ED64',
          dark: '#001E2B',
        },
        lexa: {
          purple: '#7c3aed',
          'purple-light': '#a855f7',
          'purple-dark': '#4c1d95',
          bg: '#0a0015',
          card: 'rgba(124, 58, 237, 0.08)',
        }
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: [],
}