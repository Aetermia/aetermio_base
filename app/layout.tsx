import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Header } from "@/app/header";
import "./globals.css";

// Geometric like the wordmark, but tuned for dense UI text.
const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aetermia",
  description: "Tablero interno de proyectos y tareas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={manrope.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
