/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        surface: "#111827",
        primary: "#6366f1",   // indigo
        accent: "#22d3ee",    // cyan
        muted: "#9ca3af",
      },
    },
  },
  plugins: [],
};
