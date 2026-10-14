/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: {
          950: '#000000',
          900: '#080808',
          800: '#101010',
          700: '#181818',
        },
        darkCard: {
          900: '#0c0c0c',
          800: '#141414',
          700: '#1c1c1c',
        },
        festiveRed: {
          500: '#e63946',
          600: '#d90429',
          700: '#b70921',
          800: '#8b0517',
        },
        festiveGold: {
          200: '#ddb07a',
          300: '#c49640',
          400: '#a87830',
          500: '#8a5e1a',
          600: '#6e4a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        festive: ['Cinzel', 'Rozha One', 'serif']
      },
      boxShadow: {
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.6)',
        'glow-red': '0 0 20px -2px rgba(217, 4, 41, 0.4)',
        'glow-gold': '0 0 20px rgba(205, 162, 80, 0.3)',
        'gold-rim': '0 0 14px rgba(205, 162, 80, 0.22)'
      }
    },
  },
  plugins: [],
}
