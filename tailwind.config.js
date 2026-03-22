/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'marquee': 'marquee 28s linear infinite',
        'marquee2': 'marquee2 28s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'cart-shake': 'cartShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'slide-left': 'slideLeft 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'ping-once': 'ping 0.6s cubic-bezier(0, 0, 0.2, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        cartShake: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '15%': { transform: 'rotate(-18deg) scale(1.15)' },
          '30%': { transform: 'rotate(14deg) scale(1.15)' },
          '45%': { transform: 'rotate(-10deg) scale(1.1)' },
          '60%': { transform: 'rotate(8deg) scale(1.05)' },
          '75%': { transform: 'rotate(-4deg) scale(1.02)' },
          '90%': { transform: 'rotate(2deg) scale(1.01)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideLeft: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}