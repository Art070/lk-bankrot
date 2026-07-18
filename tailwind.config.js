/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f8',
          100: '#d5deec',
          200: '#aabddb',
          300: '#7f9bc9',
          400: '#547ab7',
          500: '#3a5f97',
          600: '#2c4a78',
          700: '#1f3a63',
          800: '#1a365d',
          900: '#12253f',
          950: '#0b1728',
        },
        charcoal: {
          700: '#3a4658',
          800: '#2d3748',
          900: '#1f2733',
        },
        gold: {
          50: '#faf6e9',
          100: '#f3e9c4',
          200: '#e9d689',
          300: '#ddc255',
          400: '#d4af37',
          500: '#bf9a2c',
          600: '#9a7a22',
          700: '#75591d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(26, 54, 93, 0.06), 0 8px 24px rgba(26, 54, 93, 0.06)',
        'card-hover': '0 4px 12px rgba(26, 54, 93, 0.10), 0 16px 40px rgba(26, 54, 93, 0.10)',
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
