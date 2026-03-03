/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aws-blue-dark': '#232F3E',
        'aws-blue-medium': '#2E3B49',
        'aws-blue-light': '#374759',
        'aws-orange': '#FF9900',
        'aws-yellow': '#FFCC33',
        'aws-red': '#D13212',
        'aws-green': '#1E8E3E',
        'aws-gray-100': '#F8F8F8',
        'aws-gray-200': '#EAEDED',
        'aws-gray-300': '#D5DBDB',
        'aws-gray-400': '#ADB1B8',
        'aws-gray-500': '#8D9096',
        'aws-gray-600': '#545B64',
        'aws-gray-700': '#232F3E',
      },
    },
  },
  plugins: [],
}
