export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primario: "#0056b3",
        primarioClaro: "#e3f2fd"
      },
      boxShadow: {
        suave: "0 12px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
