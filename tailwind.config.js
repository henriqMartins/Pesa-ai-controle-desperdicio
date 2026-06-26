/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app':       'var(--bg-app)',
        'card':      'var(--surface)',
        'modal':     'var(--surface-3)',
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
