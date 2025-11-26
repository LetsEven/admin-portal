export default {
  content: [
    './index.html',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'custom-green': {
          100: '#E6ECEC',
          200: '#B3C6C8',
          500: '#2A5A62',
          600: '#173E44',
          700: '#133237',
          800: '#0E262A',
          900: '#09191C',
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
}