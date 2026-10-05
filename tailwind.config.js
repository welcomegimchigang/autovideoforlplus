/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        plue: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c90e7',
          600: '#0170c5',
          700: '#02599f',
          800: '#064b83',
          900: '#0b3f6d',
          950: '#072848',
        },
        beom: {
          charcoal: '#181b20',
          dark: '#0e1116',
          accent: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      aspectRatio: {
        'shorts': '9 / 16',
      }
    },
  },
  plugins: [],
}
