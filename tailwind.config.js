/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {
      colors: {
        'TextButton-color': '#005C78',
        'RemoveButton-color': '#9A3B3B',
        'ListElement-color': '#468B97'
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}

