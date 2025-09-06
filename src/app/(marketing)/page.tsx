import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";

export default function HomePage() {


  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <Container>
          <div className="grid items-center gap-8 py-16 md:grid-cols-2">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Todo para tu salud, <span className="text-emerald-700">en un solo lugar</span>
              </h1>
              <p className="mt-3 text-zinc-600">
                Medicamentos, dermocosmética, bebés y bienestar. Envíos rápidos en tu ciudad.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/productos"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700"
                >
                  Comprar ahora
                </Link>
                <Link
                  href="/categorias"
                  className="rounded-xl border px-5 py-2.5 text-zinc-800 hover:border-emerald-600 hover:text-emerald-700"
                >
                  Ver categorías
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow">
              <Image
                src="/images/farmacia.jpeg"
                alt="Farmacia online"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Categorías */}
      <section className="py-12">
        <Container>
          <h2 className="mb-6 text-xl font-semibold">Categorías populares</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* categorias */}
          </div>
        </Container>
      </section>

      {/* Destacados */}
      <section className="bg-white py-12">
        <Container>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Destacados</h2>
            <Link href="/productos" className="text-sm text-emerald-700 hover:underline">
              Ver todo
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* destacados */}
          </div>
        </Container>
      </section>

      {/* Beneficios */}
      <section className="py-12">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Envío rápido", d: "Mismo día en zonas seleccionadas." },
              { t: "Atención farmacéutica", d: "Asesoría por chat." },
              { t: "Pagos seguros", d: "Tarjeta, QR y contra entrega." },
              { t: "Devoluciones fáciles", d: "Hasta 7 días según política." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl border bg-white p-5">
                <p className="font-medium">{b.t}</p>
                <p className="mt-1 text-sm text-zinc-600">{b.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
