/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f7f8',
          100: '#dcecef',
          200: '#b8d8de',
          300: '#83bcc7',
          400: '#4f99aa',
          500: '#27748a',
          600: '#185d73',
          700: '#12475d',
          800: '#0d344a',
          900: '#09283c',
          950: '#041b2d',
        },
        charcoal: {
          700: '#3e4650',
          800: '#272b35',
          900: '#1b1e25',
        },
        gold: {
          50: '#fff9eb',
          100: '#fff0c6',
          200: '#f9daa0',
          300: '#edbd69',
          400: '#d99a40',
          500: '#bd7827',
          600: '#965818',
          700: '#713d13',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(4, 27, 45, .04), 0 14px 40px rgba(9, 40, 60, .06)',
        'card-hover': '0 8px 20px rgba(9, 40, 60, .1), 0 24px 56px rgba(9, 40, 60, .12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
