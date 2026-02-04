/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 10s infinite',
        'slide-in-left': 'slideInLeft 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'snap': 'snap 0.4s cubic-bezier(0.5, 1.5, 0.5, 1) forwards',
        'shockwave': 'shockwave 0.8s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-150%) opacity(0)' },
          '100%': { transform: 'translateX(-20%) opacity(1)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(150%) opacity(0)' },
          '100%': { transform: 'translateX(20%) opacity(1)' },
        },
        snap: {
          '0%': { transform: 'translateX(0) scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'translateX(0) scale(1)' },
        },
        shockwave: {
          '0%': { transform: 'scale(1)', opacity: '0.8', borderWidth: '4px' },
          '100%': { transform: 'scale(4)', opacity: '0', borderWidth: '0px' },
        }
      }
    },
  },
  plugins: [],
}