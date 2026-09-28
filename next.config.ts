import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public", // Dónde se guardará el Service Worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Apagamos el PWA en desarrollo para que no interfiera con tus pruebas locales
});

const nextConfig: NextConfig = {
  turbopack: {}, // <-- Agrega esta línea exacta aquí
};

export default withPWA(nextConfig);