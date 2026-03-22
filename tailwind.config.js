/** @type {import('tailwindcss').Config} */
module.exports = {
  // Added app and screens directories
  content: [
    './App.{js,ts,tsx}', 
    './components/**/*.{js,ts,tsx}',
    './screens/**/*.{js,ts,tsx}',
    './app/**/*.{js,ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Adding custom secure theme colors
        exam: {
          dark: '#1e1b4b', // Indigo 950
          primary: '#4338ca', // Indigo 600
          accent: '#e0e7ff', // Indigo 100
          bg: '#f8fafc', // Slate 50
        }
      }
    },
  },
  plugins: [],
};