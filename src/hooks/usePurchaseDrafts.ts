"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type DraftItem = {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  costoUnitario?: number;
  notas?: string;
  stockActual?: number | null;
  stockMinimo?: number | null;
};

export type DraftOrder = {
  proveedorId: number;
  proveedorNombre: string;
  items: DraftItem[];
};

const STORAGE_KEY = "fa_purchase_drafts";

function loadDrafts(): DraftOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function usePurchaseDrafts() {
  const [drafts, setDrafts] = useState<DraftOrder[]>(() => loadDrafts());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const upsertDraft = useCallback(
    (proveedorId: number, updater: (draft: DraftOrder | undefined) => DraftOrder | null) => {
      setDrafts(prev => {
        const idx = prev.findIndex(d => d.proveedorId === proveedorId);
        const current = idx >= 0 ? prev[idx] : undefined;
        const result = updater(current);
        if (!result) {
          if (idx === -1) return prev;
          const clone = [...prev];
          clone.splice(idx, 1);
          return clone;
        }
        if (idx === -1) return [...prev, { ...result, items: [...result.items] }];
        const clone = [...prev];
        clone[idx] = { ...result, items: [...result.items] };
        return clone;
      });
    },
    []
  );

  const addItem = useCallback(
    ({
      proveedorId,
      proveedorNombre,
      productoId,
      nombreProducto,
      cantidad = 1,
      costoUnitario,
      stockActual,
      stockMinimo,
    }: {
      proveedorId: number;
      proveedorNombre: string;
      productoId: number;
      nombreProducto: string;
      cantidad?: number;
      costoUnitario?: number;
      stockActual?: number | null;
      stockMinimo?: number | null;
    }) => {
      if (cantidad <= 0) cantidad = 1;
      upsertDraft(proveedorId, draft => {
        const base: DraftOrder =
          draft ?? { proveedorId, proveedorNombre, items: [] };
        const idx = base.items.findIndex(i => i.productoId === productoId);
        if (idx === -1) {
          base.items.push({
            productoId,
            nombreProducto,
            cantidad,
            costoUnitario,
            stockActual,
            stockMinimo,
          });
        } else {
          const existing = base.items[idx];
          base.items[idx] = {
            ...existing,
            cantidad: existing.cantidad + cantidad,
            costoUnitario: costoUnitario ?? existing.costoUnitario,
            stockActual,
            stockMinimo,
          };
        }
        return base;
      });
    },
    [upsertDraft]
  );

  const updateItem = useCallback(
    (
      proveedorId: number,
      productoId: number,
      changes: Partial<Pick<DraftItem, "cantidad" | "costoUnitario" | "notas">>
    ) => {
      upsertDraft(proveedorId, draft => {
        if (!draft) return null;
        const idx = draft.items.findIndex(i => i.productoId === productoId);
        if (idx === -1) return draft;
        const nextCantidad =
          changes.cantidad !== undefined ? Math.max(changes.cantidad, 1) : draft.items[idx].cantidad;
        draft.items[idx] = {
          ...draft.items[idx],
          ...changes,
          cantidad: nextCantidad,
        };
        return draft;
      });
    },
    [upsertDraft]
  );

  const removeItem = useCallback(
    (proveedorId: number, productoId: number) => {
      upsertDraft(proveedorId, draft => {
        if (!draft) return null;
        const items = draft.items.filter(i => i.productoId !== productoId);
        if (!items.length) return null;
        return { ...draft, items };
      });
    },
    [upsertDraft]
  );

  const clearProveedor = useCallback(
    (proveedorId: number) => {
      upsertDraft(proveedorId, () => null);
    },
    [upsertDraft]
  );

  const clearAll = useCallback(() => {
    setDrafts([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const totals = useMemo(() => {
    let totalItems = 0;
    drafts.forEach(d => {
      totalItems += d.items.reduce((sum, item) => sum + item.cantidad, 0);
    });
    return { totalItems };
  }, [drafts]);

  const ensureDraft = useCallback(
    (proveedorId: number, proveedorNombre: string) => {
      upsertDraft(proveedorId, draft => {
        if (draft) return draft;
        return { proveedorId, proveedorNombre, items: [] };
      });
    },
    [upsertDraft]
  );

  return {
    drafts,
    totalItems: totals.totalItems,
    addItem,
    updateItem,
    removeItem,
    clearProveedor,
    clearAll,
    ensureDraft,
  };
}
