/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app':       '#0f0d0b',
        'card':      '#1c160f',
        'modal':     '#221a10',
        'pa-orange': '#ff8a4c',
        'pa-red':    '#f0464e',
        'pa-live':   '#34d399',
        'pa-amber':  '#f59e0b',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
