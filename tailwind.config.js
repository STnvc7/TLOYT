/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {
      colors: {
        'TextButton-color': '#468B97',
        'TextButton-hover-color' : '#1D5B79',
        'RemoveButton-color': '#EF6262',
        'ListElement-color': '#F3AA60'
      },
    },
  },
  plugins: [],
}

