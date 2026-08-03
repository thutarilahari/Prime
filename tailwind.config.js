import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0B0F',
          card: '#14151B',
          hover: '#1D1F2A',
          active: '#242838',
          border: '#232635',
        },
        light: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          hover: '#F1F5F9',
          active: '#E2E8F0',
          border: '#E2E8F0',
        },
        accent: {
          green: '#10B981',
          greenHover: '#059669',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    // Register 'light:' as a custom variant — mirrors how Tailwind's dark: works.
    // Targets the .light class on <html> (applied by CourseContext toggleTheme).
    // e.g. light:bg-white applies when <html class="light"> is set.
    plugin(function ({ addVariant }) {
      addVariant('light', '.light &');
    }),
  ],
}
