/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17233f",
        line: "#d7e2f0",
        panel: "#f7fafc"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 35, 63, 0.08)"
      }
    }
  },
  plugins: []
};
