/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00C853',
          50: '#E8FFF0',
          100: '#C8FFD9',
          200: '#8BFFB0',
          300: '#4EFF87',
          400: '#11FF5E',
          500: '#00C853',
          600: '#009E42',
          700: '#007531',
          800: '#004B20',
          900: '#00220F',
        },
        dark: {
          50: '#1E293B',
          100: '#1A2332',
          200: '#162030',
          300: '#131D2C',
          400: '#0F172A',
          500: '#0B1120',
          600: '#070C16',
          700: '#03070D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
