import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // <-- ESTA LÍNEA ES VITAL
  ],
  // ... (código anterior)
  theme: {
    extend: {
      colors: {
        sua: {
          fondo: '#E3E8E4',    // Verde salvia muy suave y elegante para el fondo
          acento: '#D9AFA0',   // Rosa palo / Terracota (se queda, combina perfecto con verde)
          texto: '#2C3D30',    // Verde bosque muy oscuro para el texto (sustituye al marrón)
          borde: '#CCD4CE',    // Verde salvia medio para líneas y bordes
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
    },
  },
// ... (código posterior)
  plugins: [],
};
export default config;