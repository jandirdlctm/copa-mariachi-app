import type { Metadata, Viewport } from "next";
import { body, display } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Copa Mariachi Internacional 7v7",
  description:
    "Torneo 7v7 en Fontana, California · 22–23 de agosto · Premio $20,000. Marcadores en vivo, brackets, tablas y goleadores.",
};

export const viewport: Viewport = {
  themeColor: "#073F23",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="bg-pitch min-h-screen font-body text-cream antialiased">
        {children}
      </body>
    </html>
  );
}
