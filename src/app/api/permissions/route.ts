// app/api/permissions/route.ts
import type { NextRequest } from 'next/server';
const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const r = await fetch(`${api}/permissions`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export const runtime = 'nodejs';
