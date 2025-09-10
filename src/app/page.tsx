// app/page.tsx
'use client'
import Container from "@/components/Container";
import Newsletter from "@/components/Newsletter";
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="space-y-12 md:space-y-16">
      {/* HERO: fondo a todo el ancho, contenido contenido dentro del Container */}
      <section className="border-y bg-gradient-to-b from-emerald-50 to-white">
        <Container className="py-10 md:py-14">
          <div className="rounded-2xl border bg-white/70 backdrop-blur p-6 md:p-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Todo para tu salud, <span className="text-emerald-700">en un solo lugar</span>
              </h1>
              <p className="mt-3 text-zinc-600">
                Medicamentos OTC, dermocosmética, bebés y bienestar. Envíos en 24 h dentro de la ciudad.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/productos" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700">
                  Comprar ahora
                </a>
                <a href="/productos?cat=dermocosmética" className="rounded-xl border px-5 py-2.5 hover:bg-zinc-50">
                  Dermocosmética
                </a>
              </div>
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <li className="rounded-xl border p-3">🚚 Entrega rápida 24 h</li>
                <li className="rounded-xl border p-3">🔒 Pago seguro</li>
                <li className="rounded-xl border p-3">💬 Asesoría por WhatsApp</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* CATEGORÍAS */}
      <section>
        <Container className="space-y-4">
          <h2 className="text-xl font-semibold">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Dolor y fiebre', cat: 'analgesicos' },
              { title: 'Gripe y resfrío', cat: 'antigripales' },
              { title: 'Dermocosmética', cat: 'dermocosmetica' },
              { title: 'Bebés', cat: 'bebe' },
            ].map((c) => (
              <a key={c.cat} href={`/productos?cat=${c.cat}`} className="group rounded-2xl border p-5 hover:shadow-md transition bg-white">
                <div className="h-24 rounded-xl bg-zinc-100 mb-3 grid place-items-center text-zinc-400">Imagen</div>
                <div className="font-medium group-hover:text-emerald-700">{c.title}</div>
                <div className="text-sm text-zinc-600">Ver productos →</div>
              </a>
            ))}
          </div>
        </Container>
      </section>

      {/* MÁS VENDIDOS */}
      <section>
        <Container className="space-y-4">
          <h2 className="text-xl font-semibold">Más vendidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { nombre: 'Paracetamol 500mg x10', precio: 10.5, marca: 'Genfar' },
              { nombre: 'Ibuprofeno 400mg x10', precio: 12.0, marca: 'Bagó' },
              { nombre: 'Protector Solar FPS50 50ml', precio: 90.0, marca: 'Isdin' },
              { nombre: 'Pañales M x36', precio: 65.0, marca: 'Huggies' },
            ].map((p, i) => (
              <div key={i} className="rounded-2xl border p-4 hover:shadow-md transition bg-white">
                <div className="h-32 bg-zinc-100 rounded-lg mb-3 grid place-items-center text-zinc-400">Imagen</div>
                <div className="text-sm text-zinc-500">{p.marca}</div>
                <div className="font-medium">{p.nombre}</div>
                <div className="text-emerald-700 font-semibold">Bs. {p.precio.toFixed(2)}</div>
                <button className="mt-2 bg-emerald-600 text-white rounded-md px-3 py-1.5 hover:bg-emerald-700">
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* INFO / CONFIANZA */}
      <section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border p-5 bg-white">
              <h3 className="font-semibold">Atención al cliente</h3>
              <p className="text-sm text-zinc-600 mt-1">
                Consultas por chat o WhatsApp. Te ayudamos a elegir lo que necesitas.
              </p>
            </div>
            <div className="rounded-2xl border p-5 bg-white">
              <h3 className="font-semibold">Pagos seguros</h3>
              <p className="text-sm text-zinc-600 mt-1">QR, tarjetas y contraentrega donde aplique.</p>
            </div>
            <Newsletter />
          </div>
        </Container>
      </section>
      <Footer/>
    </div>
  );
}
