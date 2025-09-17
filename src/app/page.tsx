// app/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Container from "@/components/Container";
import Newsletter from "@/components/Newsletter";
import Footer from '../components/Footer';

interface Producto {
  id: number
  nombre: string
  descripcion?: string
  imageUrl?: string
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
        setCategorias(data)
      }
    } catch (error) {
      console.error('Error fetching categorias:', error)
    }
  }

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
            <button
              onClick={() => setSelectedCategory('')}
              className={`group rounded-2xl border p-5 hover:shadow-md transition ${
                selectedCategory === '' ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
              }`}
            >
              <div className="h-24 rounded-xl bg-zinc-100 mb-3 grid place-items-center text-zinc-400">📦</div>
              <div className={`font-medium ${selectedCategory === '' ? 'text-emerald-700' : 'group-hover:text-emerald-700'}`}>
                Todos los productos
              </div>
              <div className="text-sm text-zinc-600">Ver todos →</div>
            </button>
            {categorias.slice(0, 3).map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => setSelectedCategory(categoria.nombre)}
                className={`group rounded-2xl border p-5 hover:shadow-md transition ${
                  selectedCategory === categoria.nombre ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
                }`}
              >
                <div className="h-24 rounded-xl bg-zinc-100 mb-3 grid place-items-center text-zinc-400">🏷️</div>
                <div className={`font-medium ${selectedCategory === categoria.nombre ? 'text-emerald-700' : 'group-hover:text-emerald-700'}`}>
                  {categoria.nombre}
                </div>
                <div className="text-sm text-zinc-600">Ver productos →</div>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section>
        <Container className="space-y-4">
          <h2 className="text-xl font-semibold">
            {selectedCategory ? `Productos de ${selectedCategory}` : 'Productos destacados'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productos.length > 0 ? (
              productos.map((producto) => (
                <div key={producto.id} className="rounded-2xl border p-4 hover:shadow-md transition bg-white">
                  <div className="h-32 bg-zinc-100 rounded-lg mb-3 grid place-items-center overflow-hidden">
                    {producto.imageUrl ? (
                      <img
                        src={producto.imageUrl}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-zinc-400">Sin imagen</span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">{producto.marca.nombre}</div>
                  <div className="font-medium text-sm">{producto.nombre}</div>
                  {producto.descripcion && (
                    <div className="text-xs text-zinc-600 mt-1 line-clamp-2">{producto.descripcion}</div>
                  )}
                  <div className="text-emerald-700 font-semibold mt-2">Disponible</div>
                  <button className="mt-2 w-full bg-emerald-600 text-white rounded-md px-3 py-1.5 hover:bg-emerald-700 text-sm">
                    Ver detalles
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-zinc-500">
                {selectedCategory ? `No hay productos en la categoría "${selectedCategory}"` : 'No hay productos disponibles'}
              </div>
            )}
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
