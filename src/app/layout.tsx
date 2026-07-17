import type { Metadata } from "next";
import { Bitter, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AssistantWidget from "@/components/chat/AssistantWidget";
import AuthSync from "@/components/AuthSync";
import { cn } from "@/lib/utils";

// next/font inyecta estas variables "crudas"; globals.css (@theme) las expone
// como --font-display / --font-sans / --font-mono y genera las utilidades font-*.
const bitter = Bitter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-bitter",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
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
    <html lang="es" className={cn(bitter.variable, ibmPlexSans.variable, ibmPlexMono.variable)}>
      <body>
        <AuthSync />
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}
