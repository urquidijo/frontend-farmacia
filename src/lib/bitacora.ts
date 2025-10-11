// /lib/bitacora.ts
export type EstadoBitacora = 'EXITOSO' | 'FALLIDO'

// -------- JSON serializable (sin any) --------
type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | { [k: string]: JSONValue } | JSONValue[]
export type JSONObject = { [k: string]: JSONValue }

// -------- Payloads y opciones --------
export interface BitacoraPayload {
  userId?: number | null
  ip?: string | null
  acciones: string
  estado: EstadoBitacora
  extra?: JSONObject
}

type LogOpts = {
  silent?: boolean
  keepalive?: boolean
  beacon?: boolean
}

// -------- Utils --------
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Error desconocido'
}

// -------- Core --------
export async function logBitacora(
  { userId, ip, acciones, estado, extra }: BitacoraPayload,
  opts: LogOpts = { silent: true, keepalive: false, beacon: false }
): Promise<void> {
  try {
    const payload: {
      userId: number
      ip?: string
      acciones: string
      estado: EstadoBitacora
      extra?: JSONObject
    } = {
      userId: userId ?? 0,
      ip: ip ?? undefined,
      acciones,
      estado,
      extra: extra ?? undefined,
    }

    // 1) sendBeacon (fire-and-forget) si se pide
    if (opts.beacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      navigator.sendBeacon('/api/bitacora', blob)
      return
    }

    // 2) fetch con keepalive (payload pequeño)
    await fetch('/api/bitacora', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      keepalive: !!opts.keepalive,
    })
  } catch (e: unknown) {
    if (!opts.silent) console.error('Error registrando bitácora:', getErrorMessage(e))
  }
}

// -------- Helpers --------
export const logOk = (
  acciones: string,
  p: Omit<BitacoraPayload, 'acciones' | 'estado'> = {},
  o?: LogOpts
) => logBitacora({ ...p, acciones, estado: 'EXITOSO' }, o)

export const logFail = (
  acciones: string,
  p: Omit<BitacoraPayload, 'acciones' | 'estado'> = {},
  o?: LogOpts
) => logBitacora({ ...p, acciones, estado: 'FALLIDO' }, o)
