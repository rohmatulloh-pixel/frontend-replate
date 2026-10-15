/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00a896',
          600: '#028090',
          700: '#0d7a75',
          800: '#0a5c56',
          900: '#05443e',
          950: '#022c28',
          DEFAULT: '#00a896',
        },
        sun: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#fbc02d',
          600: '#eab308',
          700: '#ca8a04',
          DEFAULT: '#fbc02d',
        },
        skysoft: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          DEFAULT: '#bae6fd',
        },
        coral: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          DEFAULT: '#fb7185',
        },
        route: {
          redistribute: '#00a896',
          process: '#f59e0b',
          organic: '#84cc16',
        }
      },
      fontFamily: {
        display: ['"Fredoka"', '"Nunito"', '"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Nunito"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(2, 128, 144, 0.08), 0 2px 6px -1px rgba(2, 128, 144, 0.04)',
        'card': '0 10px 25px -3px rgba(15, 118, 110, 0.08), 0 4px 10px -2px rgba(15, 118, 110, 0.04)',
        'pill': '0 2px 10px rgba(0, 168, 150, 0.15)',
        'sun': '0 4px 14px rgba(251, 192, 45, 0.35)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'snappy': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      animation: {
        'fadeIn': 'fadeIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scaleUp': 'scaleUp 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translate3d(0, 6px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale3d(0.96, 0.96, 1)' },
          '100%': { opacity: '1', transform: 'scale3d(1, 1, 1)' },
        }
      }
    },
  },
  plugins: [],
}
