/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'primary-text': '#1A1A1A',
        'secondary': '#595959',
        'background': '#FFFFFF',
        'action-btn': '#1565C0',
        'alert-red': '#D32F2F',
        'success-green': '#2E7D32',

        'aily-bg': '#FFFFFF',
        'aily-primary': '#1A1A1A',
        'aily-secondary': '#595959',
        'aily-blue': '#1565C0',
        'aily-red': '#D32F2F',
        'aily-green': '#2E7D32',
      },
      fontSize: {
        'aily-h1': '2rem',
        'aily-h2': '1.5rem',
        'aily-action': '1.375rem',
        'aily-body-lg': '1.25rem',
        'aily-body-sm': '1.125rem',
      },
      fontFamily: {
        'atkinson': ['AtkinsonHyperlegible_400Regular'],
        'atkinson-bold': ['AtkinsonHyperlegible_700Bold'],
      },
      letterSpacing: {
        'tightest': '0.03em',
      }
    },
  },
  plugins: [],
}

