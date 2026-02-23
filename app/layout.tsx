import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import RoleProvider from "@/components/RoleProvider";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APP Bodegas - Gestión de tiendas y pedidos",
  description: "Aplicación para gestión de bodegas, pedidos y entregas",
  // Configuración de viewport para mejor experiencia móvil
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  // Tema de color para la barra de navegación del móvil
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          <RoleProvider>
            <TopNav />
            {children}
          </RoleProvider>
        </AppProviders>
      </body>
    </html>
  );
}
