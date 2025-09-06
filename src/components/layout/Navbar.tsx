"use client";
import Link from "next/link";
import Container from "./Container";
import useAuthState from "@/hooks/useAuthState";
import { clearUser } from "@/lib/auth";
import UserAvatar from "@/components/ui/UserAvatar";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const user = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const logout = () => {
    clearUser();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-emerald-700">
            Salud<span className="text-zinc-900">+</span>
          </Link>

          <nav className="hidden gap-6 md:flex">
            <Link href="/productos" className={`text-sm hover:text-emerald-700 ${pathname.startsWith("/productos") ? "text-emerald-700" : "text-zinc-700"}`}>Productos</Link>
            <Link href="/categorias" className={`text-sm hover:text-emerald-700 ${pathname.startsWith("/categorias") ? "text-emerald-700" : "text-zinc-700"}`}>Categorías</Link>
            <Link href="/info/preguntas-frecuentes" className={`text-sm hover:text-emerald-700 ${pathname.startsWith("/info") ? "text-emerald-700" : "text-zinc-700"}`}>Ayuda</Link>
          </nav>

          <div className="relative flex items-center gap-3">
            <Link href="/checkout/carrito" className="rounded-full border px-3 py-1.5 text-sm hover:border-emerald-600 hover:text-emerald-700">Carrito</Link>

            {/* SI NO está logueado → mostrar Iniciar / Crear */}
            {!user && (
              <>
                <Link href="/account/login" className="text-sm hover:text-emerald-700">Iniciar sesión</Link>
                <Link href="/account" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                  Crear cuenta
                </Link>
              </>
            )}

            {/* SI está logueado → ocultar Iniciar/Crear y mostrar Resumen (o avatar con menú) */}
            {user && (
              <div className="relative">
                <button onClick={() => setOpen((s) => !s)} className="rounded-full outline-none ring-emerald-600 focus:ring-2">
                  <UserAvatar name={user.name} />
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border bg-white shadow">
                    <div className="px-3 py-2 text-xs text-zinc-500">Hola, {user.name.split(" ")[0]}</div>
                    <Link href="/account" className="block px-3 py-2 text-sm hover:bg-emerald-50" onClick={() => setOpen(false)}>
                      Resumen de la cuenta
                    </Link>
                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50" onClick={logout}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
