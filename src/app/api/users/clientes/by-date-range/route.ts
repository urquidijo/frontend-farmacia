import type { NextRequest } from 'next/server';

const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const fechaInicial = searchParams.get('fechaInicial');
  const fechaFinal = searchParams.get('fechaFinal');

  if (!fechaInicial || !fechaFinal) {
    return new Response(JSON.stringify({ error: 'fechaInicial y fechaFinal son requeridos' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const params = new URLSearchParams({
    fechaInicial,
    fechaFinal,
  });

  const r = await fetch(`${api}/users/clientes/by-date-range?${params.toString()}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
