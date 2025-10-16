/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Add this for theme switching
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animate'), // Add this plugin
    require('@tailwindcss/typography'),
  ],
};
