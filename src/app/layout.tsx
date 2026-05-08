import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | MoView",
    default: "MoView - Generador de Widgets de Cine",
  },
  description: "Crea y comparte widgets cinematográficos hermosos de tus películas favoritas. Diseños modernos y retro para redes sociales.",
  keywords: ["cine", "películas", "widgets", "reseñas", "reviews", "compartir", "instagram", "twitter", "moview"],
  authors: [{ name: "Jomaru" }],
  openGraph: {
    title: "MoView - Generador de Widgets de Cine",
    description: "Crea y comparte widgets cinematográficos hermosos de tus películas favoritas.",
    url: "https://moview.vercel.app", // Adjust if your domain is different
    siteName: "MoView",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MoView - Generador de Widgets de Cine",
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
    <html lang="es">
      <body>
        <LanguageProvider>
          {children}
          <Toaster theme="dark" position="top-center" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
