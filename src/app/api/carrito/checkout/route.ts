import type { NextRequest } from 'next/server'

/**
 * ✅ URL del backend (Railway)
 * En Vercel, asegúrate de tener la variable:
 * NEXT_PUBLIC_API_URL=https://backend-farmacia-production.up.railway.app/api
 */
const api = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    if (!api) {
      return new Response(
        JSON.stringify({ message: 'Backend API URL no configurada' }),
        { status: 500 }
      )
    }

    // 🔹 Pasar cookie de sesión del cliente
    const cookie = req.headers.get('cookie') ?? ''

    // 🔹 Forward al backend de Railway
    const r = await fetch(`${api}/carrito/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie, // enviamos la cookie real del cliente
      },
      credentials: 'include',
    })

    // 🔹 Si el backend devuelve texto o JSON, reenviarlo igual
    const contentType = r.headers.get('content-type') ?? 'application/json'
    const body = await r.text()

    return new Response(body, {
      status: r.status,
      headers: {
        'content-type': contentType,
        // ✅ Permitir que el navegador reciba las cookies
        'Access-Control-Allow-Origin': 'https://frontend-farmacia-iota.vercel.app',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  } catch (error) {
    console.error('❌ Error proxy /api/carrito/checkout:', error)
    return new Response(
      JSON.stringify({ message: 'Error al comunicarse con el backend' }),
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
