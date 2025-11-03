'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { Trash2, Loader2, CheckCircle2, CircleX, Building2 } from 'lucide-react';
import { usePurchaseDrafts } from '@/hooks/usePurchaseDrafts';

const SUPPLIER_COST_FACTOR = 0.75;

type EstadoOrdenCompra = 'BORRADOR' | 'ENVIADA' | 'CONFIRMADA' | 'RECIBIDA' | 'CERRADA' | 'CANCELADA';

type OrdenCompraItem = {
  id: number;
  productoId: number;
  cantidadSolic: number;
  cantidadRecib: number;
  costoUnitario: number | null;
  subtotal: number | null;
  notas?: string | null;
  producto: {
    id: number;
    nombre: string;
  };
};

type OrdenCompra = {
  id: number;
  proveedor: {
    id: number;
    nombre: string;
    contacto?: string | null;
    telefono?: string | null;
    email?: string | null;
  };
  estado: EstadoOrdenCompra;
  fechaCreacion: string;
  fechaEnvio?: string | null;
  fechaRecepcion?: string | null;
  totalEstimado?: number | null;
  notas?: string | null;
  items: OrdenCompraItem[];
};

type Proveedor = {
  id: number;
  nombre: string;
  contacto?: string | null;
};

type ProductoBusqueda = {
  id: number;
  nombre: string;
  proveedorId?: number | null;
  precio?: number | null;
  stockMinimo?: number | null;
  stockActual?: number | null;
};

type ItemUpdatePayload = {
  cantidadSolic?: number;
  costoUnitario?: number | null;
};

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  CONFIRMADA: 'Confirmada',
  RECIBIDA: 'Recibida',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada',
};

const ESTADOS_EDITABLES: EstadoOrdenCompra[] = ['BORRADOR', 'ENVIADA', 'CONFIRMADA', 'RECIBIDA', 'CERRADA', 'CANCELADA'];

const ESTADO_STYLES: Record<EstadoOrdenCompra, string> = {
  BORRADOR: 'bg-zinc-100 text-zinc-700',
  ENVIADA: 'bg-blue-100 text-blue-700',
  CONFIRMADA: 'bg-indigo-100 text-indigo-700',
  RECIBIDA: 'bg-emerald-100 text-emerald-700',
  CERRADA: 'bg-emerald-200 text-emerald-800',
  CANCELADA: 'bg-rose-100 text-rose-700',
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error en la peticion');
  }
  return res.json();
}

function estadoPuedeEditarItems(estado: EstadoOrdenCompra) {
  return estado === 'BORRADOR' || estado === 'ENVIADA' || estado === 'CONFIRMADA';
}

export default function OrdenesCompraPage() {
  const { drafts, addItem, updateItem, removeItem, clearProveedor, ensureDraft } = usePurchaseDrafts();
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoOrdenCompra | 'all'>('all');
  const [search, setSearch] = useState('');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [creatingDraftProveedor, setCreatingDraftProveedor] = useState('');
  const [itemEdits, setItemEdits] = useState<Record<number, { cantidad: number; costo?: number | null }>>({});

  const fetchOrdenes = useCallback(async () => {
    try {
      setLoadingOrdenes(true);
      const params = new URLSearchParams();
      if (estadoFiltro !== 'all') params.set('estado', estadoFiltro);
      if (search.trim()) params.set('search', search.trim());
      const data = await fetchJSON<{ items: OrdenCompra[] }>('/api/ordenes-compra?' + params.toString());
      setOrdenes(data.items);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar las ordenes de compra', 'error');
    } finally {
      setLoadingOrdenes(false);
    }
  }, [estadoFiltro, search]);

  const fetchProveedores = useCallback(async () => {
    try {
      const res = await fetchJSON<{ items: Proveedor[] }>('/api/proveedores?pageSize=100');
      setProveedores(res.items ?? []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void fetchOrdenes();
  }, [fetchOrdenes]);

  useEffect(() => {
    void fetchProveedores();
  }, [fetchProveedores]);

  const handleCrearOrdenDesdeDraft = async (proveedorId: number, notas?: string) => {
    const draft = drafts.find(d => d.proveedorId === proveedorId);
    if (!draft) return;
    try {
      await fetchJSON('/api/ordenes-compra', {
        method: 'POST',
        body: JSON.stringify({
          proveedorId: draft.proveedorId,
          notas,
          items: draft.items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            notas: item.notas,
          })),
        }),
      });
      clearProveedor(proveedorId);
      Swal.fire('Orden generada', 'La orden de compra fue creada correctamente.', 'success');
      void fetchOrdenes();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo crear la orden de compra', 'error');
    }
  };

  const handleChangeEstado = async (ordenId: number, estado: EstadoOrdenCompra) => {
    try {
      await fetchJSON(`/api/ordenes-compra/${ordenId}/estado`, {
        method: 'POST',
        body: JSON.stringify({ estado }),
      });
      Swal.fire('Estado actualizado', 'La orden fue actualizada correctamente.', 'success');
      void fetchOrdenes();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const handleEliminarOrden = async (ordenId: number) => {
    const confirm = await Swal.fire({
      title: 'Eliminar orden',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      await fetchJSON(`/api/ordenes-compra/${ordenId}`, { method: 'DELETE' });
      Swal.fire('Eliminada', 'La orden fue eliminada.', 'success');
      void fetchOrdenes();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo eliminar la orden', 'error');
    }
  };

  const handleGuardarItem = async (orden: OrdenCompra, item: OrdenCompraItem) => {
    const edits = itemEdits[item.id];
    const payload: ItemUpdatePayload = {};
    if (edits?.cantidad !== undefined && edits.cantidad !== item.cantidadSolic) {
      payload.cantidadSolic = edits.cantidad;
    }
    if (edits?.costo !== undefined && edits.costo !== item.costoUnitario) {
      payload.costoUnitario = edits.costo;
    }
    if (Object.keys(payload).length === 0) {
      Swal.fire('Sin cambios', 'No hay modificaciones para guardar.', 'info');
      return;
    }
    try {
      await fetchJSON(`/api/ordenes-compra/${orden.id}/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setItemEdits(prev => {
        const clone = { ...prev };
        delete clone[item.id];
        return clone;
      });
      Swal.fire('Guardado', 'El item fue actualizado.', 'success');
      void fetchOrdenes();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el item', 'error');
    }
  };

  const handleEliminarItem = async (orden: OrdenCompra, item: OrdenCompraItem) => {
    const confirm = await Swal.fire({
      title: 'Eliminar producto',
      text: 'Se quitara el producto de la orden.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      await fetchJSON(`/api/ordenes-compra/${orden.id}/items/${item.id}`, {
        method: 'DELETE',
      });
      Swal.fire('Eliminado', 'El producto fue retirado de la orden.', 'success');
      void fetchOrdenes();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo eliminar el producto', 'error');
    }
  };

  const handleAgregarItemOrden = async (orden: OrdenCompra, producto: ProductoBusqueda) => {
    const precioBase =
      producto.precio !== undefined && producto.precio !== null ? Number(producto.precio) : undefined;
    const costoUnitario =
      typeof precioBase === 'number' && !Number.isNaN(precioBase)
        ? Number((precioBase * SUPPLIER_COST_FACTOR).toFixed(2))
        : undefined;
    try {
      await fetchJSON(`/api/ordenes-compra/${orden.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          productoId: producto.id,
          cantidad: 1,
          costoUnitario,
        }),
      });
      Swal.fire('Agregado', 'El producto se anadio a la orden.', 'success');
      void fetchOrdenes();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo agregar el producto', 'error');
    }
  };

  const handleCrearDraftManual = () => {
    if (!creatingDraftProveedor) return;
    const proveedorId = Number(creatingDraftProveedor);
    const proveedor = proveedores.find(p => p.id === proveedorId);
    if (!proveedor) return;
    ensureDraft(proveedor.id, proveedor.nombre);
    setCreatingDraftProveedor('');
    Swal.fire('Borrador creado', 'Ya puedes agregar productos a la orden.', 'success');
  };

  const summaryDraftUnits = drafts.reduce((sum, draft) => sum + draft.items.length, 0);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Ordenes de compra</h1>
          <p className="text-sm text-zinc-600">
            Administra solicitudes a proveedores, confirma recepciones y revisa el estado de tus operaciones de compra.
          </p>
        </div>
        <Link
          href="/admin/inventario/proveedores"
          className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
        >
          <Building2 size={16} />
          Ver proveedores
        </Link>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-zinc-500">Filtro por estado</div>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as EstadoOrdenCompra | 'all')}
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            {ESTADOS_EDITABLES.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_LABEL[estado]}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-zinc-500">Buscar</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Proveedor o nota..."
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={() => fetchOrdenes()}
            className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Aplicar filtros
          </button>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-emerald-700">Nuevo borrador</div>
          <select
            value={creatingDraftProveedor}
            onChange={(e) => setCreatingDraftProveedor(e.target.value)}
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Selecciona proveedor</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={handleCrearDraftManual}
            disabled={!creatingDraftProveedor}
            className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Crear borrador
          </button>
          {drafts.length > 0 && (
            <p className="mt-3 text-xs text-emerald-700">
              Tienes {drafts.length} borrador{drafts.length === 1 ? '' : 'es'} con {summaryDraftUnits} productos.
            </p>
          )}
        </div>
      </div>

      {drafts.length > 0 && (
        <section className="space-y-4 rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-700">Borradores locales</h2>
          <p className="text-sm text-zinc-600">
            Estos borradores viven en tu navegador. Puedes ajustarlos y luego generar la orden oficial.
          </p>
          <div className="space-y-4">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.proveedorId}
                draft={draft}
                onConfirm={handleCrearOrdenDesdeDraft}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
                onClear={clearProveedor}
                addItem={addItem}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Ordenes registradas</h2>
          <button
            onClick={() => fetchOrdenes()}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshIcon />
            Refrescar
          </button>
        </div>
        {loadingOrdenes ? (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando ordenes...
          </div>
        ) : ordenes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
            No hay ordenes de compra registradas.
          </div>
        ) : (
          <div className="space-y-4">
            {ordenes.map((orden) => (
              <OrdenCard
                key={orden.id}
                orden={orden}
                onChangeEstado={handleChangeEstado}
                onEliminar={handleEliminarOrden}
                onGuardarItem={handleGuardarItem}
                onEliminarItem={handleEliminarItem}
                setItemEdits={setItemEdits}
                itemEdits={itemEdits}
                onAgregarProducto={handleAgregarItemOrden}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function DraftCard({
  draft,
  onConfirm,
  onUpdateItem,
  onRemoveItem,
  onClear,
  addItem,
}: {
  draft: ReturnType<typeof usePurchaseDrafts>['drafts'][number];
  onConfirm: (proveedorId: number, notas?: string) => void;
  onUpdateItem: ReturnType<typeof usePurchaseDrafts>['updateItem'];
  onRemoveItem: ReturnType<typeof usePurchaseDrafts>['removeItem'];
  onClear: ReturnType<typeof usePurchaseDrafts>['clearProveedor'];
  addItem: ReturnType<typeof usePurchaseDrafts>['addItem'];
}) {
  const [notas, setNotas] = useState('');

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-emerald-800">{draft.proveedorNombre}</h3>
          <p className="text-xs text-emerald-700">
            {draft.items.length} producto{draft.items.length === 1 ? '' : 's'} en el borrador.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onClear(draft.proveedorId)}
            className="rounded-md border border-emerald-300 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
          >
            Vaciar
          </button>
          <button
            onClick={() => onConfirm(draft.proveedorId, notas)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Generar orden
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {draft.items.map((item) => (
          <div
            key={item.productoId}
            className="flex flex-col gap-2 rounded-md border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="text-sm font-medium text-zinc-900">{item.nombreProducto}</div>
              <div className="text-xs text-zinc-500">
                Stock actual: {item.stockActual ?? 0} / minimo: {item.stockMinimo ?? 0}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
              <label className="flex items-center gap-1">
                Cantidad
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) =>
                    onUpdateItem(draft.proveedorId, item.productoId, {
                      cantidad: Math.max(parseInt(e.target.value) || 1, 1),
                    })
                  }
                  className="w-16 rounded-md border px-2 py-1 text-xs"
                />
              </label>
              <label className="flex items-center gap-1">
                Costo
                <input
                  type="number"
                  min={0}
                  value={item.costoUnitario ?? ''}
                  onChange={(e) =>
                    onUpdateItem(draft.proveedorId, item.productoId, {
                      costoUnitario: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Bs."
                  className="w-20 rounded-md border px-2 py-1 text-xs"
                />
              </label>
              <button
                onClick={() => onRemoveItem(draft.proveedorId, item.productoId)}
                className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-emerald-700">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm"
            placeholder="Observaciones para el proveedor"
          />
        </div>
        <DraftProductSearch
          proveedorId={draft.proveedorId}
          onSelect={(producto) => {
            const precioBase =
              producto.precio !== undefined && producto.precio !== null
                ? Number(producto.precio)
                : undefined;
            const costoUnitario =
              typeof precioBase === 'number' && !Number.isNaN(precioBase)
                ? Number((precioBase * SUPPLIER_COST_FACTOR).toFixed(2))
                : undefined;
            addItem({
              proveedorId: draft.proveedorId,
              proveedorNombre: draft.proveedorNombre,
              productoId: producto.id,
              nombreProducto: producto.nombre,
              cantidad: 1,
              costoUnitario,
            });
          }}
        />
      </div>
    </div>
  );
}

function DraftProductSearch({
  proveedorId,
  onSelect,
}: {
  proveedorId: number;
  onSelect: (producto: ProductoBusqueda) => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductoBusqueda[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const data = await fetchJSON<{ productos: ProductoBusqueda[] }>(
        `/api/admin/productos/search?q=${encodeURIComponent(query)}&proveedorId=${proveedorId}&size=6`,
      );
      const normalized =
        data.productos?.map((producto) => ({
          ...producto,
          precio:
            producto.precio !== undefined && producto.precio !== null
              ? Number(producto.precio)
              : null,
        })) ?? [];
      setResults(normalized);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron buscar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-100/40 p-3">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          onClick={handleSearch}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Buscar
        </button>
      </div>
      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Buscando productos...
        </div>
      ) : results.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-emerald-900">
          {results.map((producto) => (
            <li
              key={producto.id}
              className="flex items-center justify-between rounded-md border border-emerald-200 bg-white px-2 py-1"
            >
              <span>
                {producto.nombre}
                {producto.precio !== undefined && producto.precio !== null
                  ? ` - Bs ${Number(producto.precio).toFixed(2)}`
                  : ''}
              </span>
              <button
                onClick={() => onSelect(producto)}
                className="rounded-md border border-emerald-300 px-2 py-0.5 text-emerald-700 hover:bg-emerald-100"
              >
                Agregar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        query &&
        !loading && <div className="mt-2 text-xs text-emerald-700">Sin resultados para la busqueda.</div>
      )}
    </div>
  );
}

function OrdenCard({
  orden,
  onChangeEstado,
  onEliminar,
  onGuardarItem,
  onEliminarItem,
  setItemEdits,
  itemEdits,
  onAgregarProducto,
}: {
  orden: OrdenCompra;
  onChangeEstado: (ordenId: number, estado: EstadoOrdenCompra) => void;
  onEliminar: (ordenId: number) => void;
  onGuardarItem: (orden: OrdenCompra, item: OrdenCompraItem) => void;
  onEliminarItem: (orden: OrdenCompra, item: OrdenCompraItem) => void;
  setItemEdits: React.Dispatch<
    React.SetStateAction<Record<number, { cantidad: number; costo?: number | null }>>
  >;
  itemEdits: Record<number, { cantidad: number; costo?: number | null }>;
  onAgregarProducto: (orden: OrdenCompra, producto: ProductoBusqueda) => void;
}) {
  const puedeEditar = estadoPuedeEditarItems(orden.estado);

  const handleChange = (item: OrdenCompraItem, field: 'cantidad' | 'costo', value: number | null) => {
    setItemEdits((prev) => ({
      ...prev,
      [item.id]: {
        cantidad: field === 'cantidad' ? Math.max(value ?? item.cantidadSolic, 1) : prev[item.id]?.cantidad ?? item.cantidadSolic,
        costo: field === 'costo' ? value : prev[item.id]?.costo ?? item.costoUnitario ?? undefined,
      },
    }));
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            OC-{orden.id} - {orden.proveedor.nombre}
          </h3>
          <p className="text-xs text-zinc-600">
            Creada el {new Date(orden.fechaCreacion).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ESTADO_STYLES[orden.estado]}`}>
            {ESTADO_LABEL[orden.estado]}
          </span>
          <select
            value={orden.estado}
            onChange={(e) => onChangeEstado(orden.id, e.target.value as EstadoOrdenCompra)}
            className="rounded-md border px-2 py-1 text-xs"
          >
            {ESTADOS_EDITABLES.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_LABEL[estado]}
              </option>
            ))}
          </select>
          {orden.estado === 'BORRADOR' && (
            <button
              onClick={() => onEliminar(orden.id)}
              className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 size={12} />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {orden.notas && (
        <div className="mt-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
          {orden.notas}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {orden.items.map((item) => {
          const edits = itemEdits[item.id];
          const cantidad = edits?.cantidad ?? item.cantidadSolic;
          const costo = edits?.costo ?? item.costoUnitario ?? null;
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-medium text-zinc-900">{item.producto.nombre}</div>
                <div className="text-xs text-zinc-500">
                  Solicitado: {item.cantidadSolic} - Recibido: {item.cantidadRecib}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <label className="flex items-center gap-1">
                  Cant.
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      handleChange(item, 'cantidad', Math.max(parseInt(e.target.value) || 1, 1))
                    }
                    className="w-16 rounded-md border px-2 py-1 text-xs"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Costo
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costo ?? ''}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      handleChange(
                        item,
                        'costo',
                        e.target.value === '' ? null : Math.max(parseFloat(e.target.value), 0),
                      )
                    }
                    className="w-20 rounded-md border px-2 py-1 text-xs"
                  />
                </label>
                <div className="text-xs text-zinc-500">
                  Subtotal: {item.subtotal !== null && item.subtotal !== undefined ? `Bs ${item.subtotal.toFixed(2)}` : 'N/D'}
                </div>
                {puedeEditar && (
                  <>
                    <button
                      onClick={() => onGuardarItem(orden, item)}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2 py-1 text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCircle2 size={12} />
                      Guardar
                    </button>
                    <button
                      onClick={() => onEliminarItem(orden, item)}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50"
                    >
                      <CircleX size={12} />
                      Quitar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {puedeEditar && (
        <div className="mt-3">
          <DraftProductSearch proveedorId={orden.proveedor.id} onSelect={(producto) => onAgregarProducto(orden, producto)} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-zinc-500">
        <div>
          Creada: {new Date(orden.fechaCreacion).toLocaleString()}
          {orden.fechaEnvio && ` - Enviada: ${new Date(orden.fechaEnvio).toLocaleString()}`}
          {orden.fechaRecepcion && ` - Recepcion: ${new Date(orden.fechaRecepcion).toLocaleString()}`}
        </div>
        <div className="font-semibold text-zinc-700">
          Total estimado:{' '}
          {orden.totalEstimado !== null && orden.totalEstimado !== undefined
            ? `Bs ${orden.totalEstimado.toFixed(2)}`
            : 'N/D'}
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return <RefreshCw className="h-4 w-4" />;
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10a9 9 0 0115.546-5.03M21 14a9 9 0 01-15.546 5.03M21 3v6h-6"
      />
    </svg>
  );
}
