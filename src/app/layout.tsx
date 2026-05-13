import type { Metadata } from "next";
import { Bodoni_Moda, Geist } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    template: "%s | MeoWiew",
    default: "MeoWiew - Generador de Widgets de Cine",
  },
  description: "Crea y comparte widgets cinematográficos hermosos de tus películas favoritas. Diseños modernos y retro para redes sociales.",
  keywords: ["cine", "películas", "widgets", "reseñas", "reviews", "compartir", "instagram", "twitter", "meowiew"],
  authors: [{ name: "Jomaru" }],
  openGraph: {
    title: "MeoWiew - Generador de Widgets de Cine",
    description: "Crea y comparte widgets cinematográficos hermosos de tus películas favoritas.",
    url: "https://meowiew.vercel.app",
    siteName: "MeoWiew",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeoWiew - Generador de Widgets de Cine",
    description: "Crea y comparte widgets cinematográficos hermosos de tus películas favoritas.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

import { Toaster } from "sonner";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${geist.variable}`}>
      <body className="antialiased">
        <LanguageProvider>
          {children}
          <Toaster theme="dark" position="top-center" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
