/**
 * @fileoverview Tailwind Config — Design System Edition
 * Applies: design-md (Cardinal Red system, Amber Gold accents, motion tokens)
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Design System Colors ───────────────────────────────
      colors: {
        cardinal: {
          DEFAULT: '#ba1f3d',
          light: '#d4294d',
          dark: '#8B0000',
          50: 'rgba(186,31,61,0.05)',
          100: 'rgba(186,31,61,0.10)',
        },
        crimson: '#F63049',
        'amber-gold': '#FBBF24',
        obsidian: '#111827',
        'admin-dark': '#0d0508',
      },

      // ── Typography ─────────────────────────────────────────
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // ── Letter Spacing ─────────────────────────────────────
      letterSpacing: {
        'ultra': '0.5em',
        'badge': '0.35em',
        'label': '0.3em',
        'nav': '0.25em',
      },

      // ── Shadows ────────────────────────────────────────────
      boxShadow: {
        'cardinal': '0 20px 60px rgba(186,31,61,0.2)',
        'cardinal-lg': '0 30px 80px rgba(186,31,61,0.3)',
        'glow': '0 0 30px rgba(186,31,61,0.4)',
        'diffuse': '0 20px 60px rgba(0,0,0,0.08)',
        'luxury': '0 40px 100px rgba(0,0,0,0.12)',
      },

      // ── Border Radius ──────────────────────────────────────
      borderRadius: {
        'none': '0',        // Sharp — hero buttons, product badges
        'sm': '2px',        // Admin cards
        'xl': '12px',       // Functional buttons
        '2xl': '16px',      // Modals, drawers
        '3xl': '24px',      // Cards, overlays
      },

      // ── Animations ─────────────────────────────────────────
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3.5s ease-in-out infinite',
        'cart-shake': 'cartShake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'shimmer': 'shimmer 1.8s infinite linear',
        'ping-once': 'pingOnce 0.6s cubic-bezier(0, 0, 0.2, 1) forwards',
        'reveal-up': 'revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fabric': 'fabricWave 4s ease-in-out infinite',
        'marquee': 'marquee 28s linear infinite',
        'marquee2': 'marquee 28s linear infinite reverse',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },

      // ── Keyframes ──────────────────────────────────────────
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pingOnce: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%': { transform: 'scale(2)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        revealUp: {
          from: { clipPath: 'inset(100% 0% 0% 0%)' },
          to: { clipPath: 'inset(0% 0% 0% 0%)' },
        },
        fabricWave: {
          '0%, 100%': { transform: 'skewX(0deg) scaleY(1)' },
          '25%': { transform: 'skewX(1deg) scaleY(1.01)' },
          '75%': { transform: 'skewX(-1deg) scaleY(0.99)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
      },

      // ── Transitions ─────────────────────────────────────────
      transitionTimingFunction: {
        'fabric': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'silk': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
        '1200': '1200ms',
      },
    },
  },
  plugins: [],
};