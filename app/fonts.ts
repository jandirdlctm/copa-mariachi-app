import { Archivo_Black, Inter } from "next/font/google";

// Heavy display face for headings + scores.
export const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Body face.
export const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
