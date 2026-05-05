/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // <-- Kaizen: Aquí está el cambio
  },
};

export default config;