/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: '#0f5132',
        feltDark: '#0a3a23',
        chipGold: '#f5c542',
      },
      fontFamily: {
        card: ['"Hiragino Sans"', '"Yu Gothic"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
