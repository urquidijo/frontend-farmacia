// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Farmacia Salud+ | Tu salud primero",
  description: "E-commerce de farmacia: medicamentos, dermo, bebé y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col">
        <NavBar />
        <main className="flex-1 pt-16">{children}</main>
        
      </body>
    </html>
  );
}
