import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const params = new URLSearchParams();
  const q = searchParams.get('q');
  const proveedorId = searchParams.get('proveedorId');
  const size = searchParams.get('size') ?? '10';

  if (q) params.append('q', q);
  if (proveedorId) params.append('proveedorId', proveedorId);
  params.append('size', size);
  params.append('page', '1');

  const res = await fetch(`${API_URL}/productos?${params.toString()}`, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
