/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: '#ff007f',
        dark: '#050505',
        card: '#121212'
      },
      boxShadow: {
        neon: '0 0 10px #ff007f, 0 0 20px #ff007f',
        'neon-sm': '0 0 5px #ff007f'
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}