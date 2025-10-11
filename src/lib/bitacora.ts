// /lib/bitacora.ts
export type EstadoBitacora = 'EXITOSO' | 'FALLIDO';
export interface BitacoraPayload {
  userId?: number | null;
  ip?: string | null;
  acciones: string;
  estado: EstadoBitacora;
  extra?: Record<string, any>;
}
type LogOpts = { silent?: boolean; keepalive?: boolean; beacon?: boolean };

export async function logBitacora(
  { userId, ip, acciones, estado, extra }: BitacoraPayload,
  opts: LogOpts = { silent: true, keepalive: false, beacon: false }
) {
  try {
    const payload = {
      userId: userId ?? 0,
      ip: ip ?? undefined,
      acciones,
      estado,
      extra: extra ?? undefined,
    };

    // 1) Intentar sendBeacon si lo pides (ideal justo antes de navegar)
    if (opts.beacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/bitacora', blob);
      return; // fire-and-forget
    }

    // 2) fetch con keepalive para que sobreviva al unload (payload debe ser pequeño)
    await fetch('/api/bitacora', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      keepalive: !!opts.keepalive,
    });
  } catch (e) {
    if (!opts.silent) console.error('Error registrando bitácora:', e);
  }
}

export const logOk = (acciones: string, p: Omit<BitacoraPayload, 'acciones'|'estado'> = {}, o?: LogOpts) =>
  logBitacora({ ...p, acciones, estado: 'EXITOSO' }, o);

export const logFail = (acciones: string, p: Omit<BitacoraPayload, 'acciones'|'estado'> = {}, o?: LogOpts) =>
  logBitacora({ ...p, acciones, estado: 'FALLIDO' }, o);
