'use client'

type Props = {
  nombre: string
  precio: number
  imagen?: string
  marca?: string
}

export default function ProductCard({ nombre, precio, imagen, marca }: Props) {
  return (
    <div className="border rounded-xl p-3 flex flex-col gap-2">
      <div className="h-36 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
        {imagen ? (
          <img src={imagen} alt={nombre} className="h-full" />
        ) : (
          <span className="text-xs text-zinc-500">Imagen no disponible</span>
        )}
      </div>
      <div className="text-sm text-zinc-500">{marca || 'Genérico'}</div>
      <div className="font-medium">{nombre}</div>
      <div className="text-emerald-700 font-semibold">Bs. {precio.toFixed(2)}</div>
      <button
        className="mt-1 bg-emerald-600 text-white rounded-md px-3 py-1.5"
        onClick={() => alert('Agregar al carrito (por ahora cliente-side)')}
      >
        Agregar
      </button>
    </div>
  )
}
