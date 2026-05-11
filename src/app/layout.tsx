import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Geist:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <Toaster theme="dark" position="top-center" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
