/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#0f1012', 900: '#16181b', 800: '#1d2024', 700: '#262a30', 600: '#343941', 500: '#4a505a', 400: '#8a909b', 300: '#b3b8c2', 200: '#d6d9df' },
        brand: { 300: '#ffb066', 400: '#ff9433', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'], display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'] },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        sweep: { from: { transform: 'translateX(-120%) skewX(-20deg)' }, to: { transform: 'translateX(320%) skewX(-20deg)' } },
        drift: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(40px,-30px) scale(1.15)' } },
      },
      animation: { marquee: 'marquee 32s linear infinite', float: 'float 6s ease-in-out infinite', sweep: 'sweep 4.5s ease-in-out infinite', drift: 'drift 14s ease-in-out infinite' },
    },
  },
  plugins: [],
}
