/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './client/src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1B2F',
        paper: '#F3F1F7',
        cobalt: '#3654FF',
        cobaltDark: '#2540CC',
        pulse: '#FFB020',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 18px 55px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        travel: {
          '0%': { left: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
      },
      animation: {
        travel: 'travel 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
