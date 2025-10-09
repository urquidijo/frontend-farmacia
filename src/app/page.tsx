'use client'
import { useState, useEffect } from 'react'
import Container from "@/components/Container";
import Newsletter from "@/components/Newsletter";
import Footer from '../components/Footer';

interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  imageUrl?: string   // 👈 viene directo de S3
  marca: { nombre: string }
  categoria: { nombre: string }
}

interface Categoria {
  id: number
  nombre: string
}

export default function HomePage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
  }, [selectedCategory])

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams({ limit: '8' })
      if (selectedCategory) {
        params.append('categoria', selectedCategory)
      }

      const response = await fetch(`/api/public/productos?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log("📦 Productos en Home:", data) // 👈 debug
        setProductos(data)
      }
    } catch (error) {
      console.error('Error fetching productos:', error)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/public/categorias')
      if (response.ok) {
        const data = await response.json()
        console.log("📂 Categorías en Home:", data) // 👈 debug
        setCategorias(data)
      }
    } catch (error) {
      console.error('Error fetching categorias:', error)
    }
  }

  return (
    <div className="space-y-12 md:space-y-16">
      {/* HERO */}
      <section className="border-y bg-gradient-to-b from-emerald-50 to-white">
        <Container className="py-10 md:py-14">
          <div className="rounded-3xl bg-white shadow-md border border-emerald-100 p-8 md:p-10 text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-zinc-900">
              Todo para tu salud,{" "}
              <span className="text-emerald-700">en un solo lugar</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Medicamentos OTC, dermocosmética, bebés y bienestar. Envíos en 24 h dentro de la ciudad.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a href="/productos" className="rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition-all shadow-md">
                Comprar ahora
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-sm max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                🚚 <span className="font-medium text-zinc-700">Entrega rápida 24 h</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                🔒 <span className="font-medium text-zinc-700">Pago seguro</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                💬 <span className="font-medium text-zinc-700">Asesoría por WhatsApp</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CATEGORÍAS */}
      <section>
        <Container className="space-y-6">
          <h2 className="text-2xl font-bold">Explora categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button
              onClick={() => setSelectedCategory('')}
              className={`group flex flex-col items-center p-6 rounded-2xl shadow-sm hover:shadow-lg transition ${
                selectedCategory === '' ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border'
              }`}
            >
              <div className="h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 mb-3 text-3xl">
                📦
              </div>
              <span className={`font-semibold ${selectedCategory === '' ? 'text-emerald-700' : 'group-hover:text-emerald-700'}`}>
                Todos
              </span>
              <span className="text-sm text-zinc-500">Ver todos →</span>
            </button>
            {categorias.slice(0, 3).map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => setSelectedCategory(categoria.nombre)}
                className={`group flex flex-col items-center p-6 rounded-2xl shadow-sm hover:shadow-lg transition ${
                  selectedCategory === categoria.nombre ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border'
                }`}
              >
                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 mb-3 text-3xl">
                  🏷️
                </div>
                <span className={`font-semibold ${selectedCategory === categoria.nombre ? 'text-emerald-700' : 'group-hover:text-emerald-700'}`}>
                  {categoria.nombre}
                </span>
                <span className="text-sm text-zinc-500">Ver más →</span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section>
        <Container className="space-y-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory ? `Productos de ${selectedCategory}` : 'Productos destacados'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {productos.length > 0 ? (
              productos.map((producto) => (
                <div key={producto.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition group overflow-hidden">
                  <div className="h-40 bg-zinc-100 rounded-t-2xl flex items-center justify-center overflow-hidden">
                    {producto.imageUrl ? (
                      <img
                        src={producto.imageUrl}   // 👈 URL directa de S3
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-zinc-400">Sin imagen</span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="text-xs text-zinc-500">{producto.marca.nombre}</div>
                    <div className="font-semibold text-sm">{producto.nombre}</div>
                    {producto.descripcion && (
                      <p className="text-xs text-zinc-600 line-clamp-2">{producto.descripcion}</p>
                    )}
                    <div className="text-emerald-700 font-bold text-lg mt-2">
                      Bs. {Number(producto.precio).toFixed(2)}
                    </div>
                    <button className="w-full mt-2 bg-emerald-600 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
                      🛒 Agregar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-zinc-500">
                {selectedCategory ? `No hay productos en "${selectedCategory}"` : 'No hay productos disponibles'}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* INFO / CONFIANZA */}
      <section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-lg">💬 Atención al cliente</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Consultas por chat o WhatsApp. Te ayudamos a elegir lo que necesitas.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-lg">🔒 Pagos seguros</h3>
              <p className="text-sm text-zinc-600 mt-2">
                QR, tarjetas y contraentrega donde aplique.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm">
              <Newsletter />
            </div>
          </div>
        </Container>
      </section>

      <Footer/>
    </div>
  );
}
