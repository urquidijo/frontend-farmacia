// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

export const metadata: Metadata = {
  title: "Farmacia Salud+ | Tu salud primero",
  description: "E-commerce de farmacia: medicamentos, dermo, bebé y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NavBar />
        <main>{children}</main>
        <ChatBot />
      </body>
    </html>
  );
}
