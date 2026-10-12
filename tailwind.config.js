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
          950: '#040711',
          900: '#070d1e',
          800: '#0b132b',
          700: '#111c38',
        },
        darkCard: {
          900: '#0e172e',
          800: '#141f3d',
          700: '#1b284f',
        },
        festiveRed: {
          500: '#e63946',
          600: '#d90429',
          700: '#b70921',
          800: '#8b0517',
        },
        festiveGold: {
          300: '#fde047',
          400: '#f59e0b',
          500: '#e9c46a',
          600: '#d4af37',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        festive: ['Cinzel', 'Rozha One', 'serif']
      },
      boxShadow: {
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.6)',
        'glow-red': '0 0 20px -2px rgba(217, 4, 41, 0.4)',
        'glow-gold': '0 0 20px -2px rgba(233, 196, 106, 0.35)'
      }
    },
  },
  plugins: [],
}
