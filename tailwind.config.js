/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/app.js"],
  theme: {
    extend: {
      colors: {
        'e0e0e0': '#e0e0e0', // Custom background color
        'bebebe': '#bebebe', // Custom dark shadow color
      },
      boxShadow: {
        'neumorphic': '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
      }
    },
  },
  plugins: [],
}
