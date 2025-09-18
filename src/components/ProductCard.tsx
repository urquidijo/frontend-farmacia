"use client";

type Props = {
  nombre: string;
  precio: number;
  imagen?: string;
  marca?: string;
};

export default function ProductCard({ nombre, precio, imagen, marca }: Props) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden group flex flex-col">
      {/* Imagen */}
      <div className="h-40 bg-zinc-100 flex items-center justify-center overflow-hidden">
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-xs text-zinc-500">Imagen no disponible</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 space-y-2">
        <span className="text-xs text-emerald-700 font-medium bg-emerald-50 rounded px-2 py-0.5 self-start">
          {marca || "Genérico"}
        </span>

        <h3 className="text-sm font-semibold text-zinc-800 line-clamp-2 flex-1">
          {nombre}
        </h3>

        <p className="text-emerald-700 font-bold text-base">
          Bs. {precio.toFixed(2)}
        </p>

        <button
          className="mt-auto w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 active:bg-emerald-800 transition"
          onClick={() =>
            alert("Agregar al carrito (por ahora cliente-side)")
          }
        >
          🛒 Agregar
        </button>
      </div>
    </div>
  );
}
