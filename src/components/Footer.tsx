export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="font-semibold">Farmacia</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Tu farmacia online de confianza. OTC, dermocosmética y bienestar.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            * Los medicamentos bajo receta se expenden conforme a normativa vigente.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Contáctanos</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>Tel: +591 700-00000</li>
            <li>WhatsApp: +591 700-00000</li>
            <li>Email: contacto@farmacia.com</li>
            <li>Santa Cruz de la Sierra, Bolivia</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">Atención</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>Lun–Vie: 09:00–20:00</li>
            <li>Sáb: 09:00–18:00</li>
            <li>Dom/Feriados: 10:00–14:00</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">Enlaces</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li><a className="hover:text-emerald-700" href="/productos">Productos</a></li>
            <li><a className="hover:text-emerald-700" href="/account">Mi cuenta</a></li>
            <li><a className="hover:text-emerald-700" href="/login">Ingresar</a></li>
            <li><a className="hover:text-emerald-700" href="/register">Crear cuenta</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-zinc-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Farmacia. Todos los derechos reservados.</span>
          <span className="text-zinc-400">Privacidad · Términos</span>
        </div>
      </div>
    </footer>
  )
}