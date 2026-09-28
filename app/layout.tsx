import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Configuración visual para móviles
export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita que la pantalla haga zoom al escanear
  userScalable: false,
};

export const metadata: Metadata = {
  title: "TuInvita Staff",
  description: "Gestión de acceso para eventos",
  manifest: "/manifest.json", // <-- Esto conecta tu manifiesto
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TuInvita Staff",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}