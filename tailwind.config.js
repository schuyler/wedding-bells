/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wedding-dark': '#363536',
        'wedding-light': '#f7f5f5',
      },
      fontFamily: {
        'eb-garamond': ['EB Garamond', 'serif'],
        'zen-antique': ['Zen Antique', 'serif'],
      },
      letterSpacing: {
        'wedding': '0.2em',
        'heading': '0.15em',
      }
    },
  },
  plugins: [],
}
