/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f8f4',
          100: '#e2f0e5',
          200: '#c4dfca',
          300: '#9dc8a7',
          400: '#6fa37d',
          500: '#4f8861',
          600: '#3d704e',
          700: '#2d593e',
          800: '#1a1a2e',
          900: '#161626',
          950: '#0f101c',
        },
        charcoal: {
          700: '#3e4650',
          800: '#272b35',
          900: '#1b1e25',
        },
        gold: {
          50: '#f1f8f3',
          100: '#dcefe1',
          200: '#b8dfc1',
          300: '#8ac99a',
          400: '#2d7b46',
          500: '#236a39',
          600: '#1e5730',
          700: '#174524',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(26, 26, 46, 0.06), 0 8px 24px rgba(26, 26, 46, 0.06)',
        'card-hover': '0 4px 12px rgba(45, 123, 70, 0.10), 0 16px 40px rgba(45, 123, 70, 0.10)',
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
