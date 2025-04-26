/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // If using App Router
  ],
  theme: {
    extend: {
       // Add custom theme extensions here if needed
       // Example dark-neon theme colors (adjust extensively)
       colors: {
         'neon-bg': '#0d0221', // Very dark purple/blue
         'neon-text': '#f0f0f0', // Off-white
         'neon-primary': '#26f7d1', // Bright teal/cyan
         'neon-secondary': '#f80b67', // Bright pink/magenta
         'neon-accent': '#a450e0', // Purple
       },
    },
  },
  plugins: [],
};