"use client";

import Container from "@/components/layout/Container";
import Link from "next/link";
import useAuthState from "@/hooks/useAuthState";
import { clearUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthState();              // null si no hay sesión
  const router = useRouter();

  const logout = () => {
    clearUser();
    router.push("/");                       // vuelves al home
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <Container>
        <div className="grid gap-8 py-10 md:grid-cols-[220px,1fr]">
          <aside className="rounded-2xl border bg-white p-4">
            <nav className="space-y-2 text-sm">
              {/* Si hay sesión → mostrar menú de cuenta */}
              {user && (
                <>
                  <Link href="/account" className="block rounded px-2 py-1 hover:bg-emerald-50">
                    Resumen
                  </Link>
                  <Link href="/account/pedidos" className="block rounded px-2 py-1 hover:bg-emerald-50">
                    Mis pedidos
                  </Link>
                  <Link href="/account/direccion" className="block rounded px-2 py-1 hover:bg-emerald-50">
                    Direcciones
                  </Link>
                  <button
                    onClick={logout}
                    className="mt-2 w-full rounded px-2 py-1 text-left hover:bg-emerald-50"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}

              {/* Si NO hay sesión → solo auth */}
              {!user && (
                <>
                  <Link href="/account" className="block rounded px-2 py-1 hover:bg-emerald-50">
                    Crear cuenta
                  </Link>
                </>
              )}
            </nav>
          </aside>

          <section>{children}</section>
        </div>
      </Container>
    </div>
  );
}
