import Container from "./Container";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <Container>
        <div className="grid gap-8 py-10 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-emerald-700">Salud+</p>
            <p className="mt-2 text-sm text-zinc-600">
              Tu farmacia online en Bolivia. Entregas el mismo día en zonas habilitadas.
            </p>
          </div>
          <div>
            <p className="mb-2 font-medium">Ayuda</p>
            <ul className="space-y-1 text-sm text-zinc-600">
              <li><Link href="/info/envios">Envíos</Link></li>
              <li><Link href="/info/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-medium">Legal</p>
            <ul className="space-y-1 text-sm text-zinc-600">
              <li><Link href="/info/privacidad">Privacidad</Link></li>
              <li><Link href="/info/terminos">Términos</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Salud+. Todos los derechos reservados.
        </div>
      </Container>
    </footer>
  );
}
