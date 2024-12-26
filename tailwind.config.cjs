module.exports = {
  // prefix: "tw-",
  important: ".tailwind",
  // important: true, // Changed from ".tailwind"
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 20s linear infinite",
      },
    },
  },
  purge: {
    enabled: true,
    content: ["./src/**/*.{html,ts,tsx}"],
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
