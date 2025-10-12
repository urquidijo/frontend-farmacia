import type { NextRequest } from 'next/server';

const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';
  const size = searchParams.get('size') || '10';
  const status = searchParams.get('status') || '';

  const params = new URLSearchParams();
  if (q) params.append('q', q);
  params.append('page', page);
  params.append('size', size);
  if (status) params.append('status', status);

  const r = await fetch(`${api}/users/clientes?${params.toString()}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  
  // Agregar rol CLIENTE al body si no está presente
  const userData = {
    ...body,
    roles: ['CLIENTE']
  };

  const r = await fetch(`${api}/users/internal`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
