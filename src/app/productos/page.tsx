"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";

type Prod = {
  id: number;
  nombre: string;
  precio: number;
  imagen?: string;
  marca?: string;
};

export default function ProductosPage() {
  const [items, setItems] = useState<Prod[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setItems(data))
      .catch(() =>
        setItems([
          {
            id: 1,
            nombre: "Paracetamol 500mg x10",
            precio: 10.5,
            marca: "Genfar",
          },
          {
            id: 2,
            nombre: "Ibuprofeno 400mg x10",
            precio: 12.0,
            marca: "Bagó",
          },
          {
            id: 3,
            nombre: "Protector Solar FPS50 50ml",
            precio: 90.0,
            marca: "Isdin",
          },
          { id: 4, nombre: "Pañales M x36", precio: 65.0, marca: "Huggies" },
        ])
      );
  }, []);

  const filtered = items.filter((p) =>
    p.nombre.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section>
      <h1 className="text-xl font-semibold mb-3">Productos</h1>
      <input
        className="border rounded-md px-3 py-2 w-full md:w-72 mb-4"
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-4">
        Los medicamentos de venta bajo receta solo se expenden según normativa
        vigente.
      </p>
    </section>
  );
}
