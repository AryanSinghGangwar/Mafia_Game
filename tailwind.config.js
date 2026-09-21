/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0e17',
        surface: '#1a1a2e',
        primary: '#7f5af0',
        accent: '#2cb67d',
        danger: '#e53170',
        warning: '#ff8906',
        text: '#fffffe',
        textMuted: '#94a1b2',
      },
    },
  },
  plugins: [],
}
