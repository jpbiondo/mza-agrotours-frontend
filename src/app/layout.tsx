import type { Metadata } from "next";
import { Bitter, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Mendoza AgroTours",
  description: "Turismo rural participativo en Mendoza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${bitter.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
