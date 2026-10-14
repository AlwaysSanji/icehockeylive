/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hockey: {
          dark: '#0F172A',
          card: '#FFFFFF',
          border: '#E5E7EB',
          emerald: '#059669',
          teal: '#00A3AD',
          gold: '#F59E0B',
          red: '#EF4444',
          subtle: '#F3F4F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
