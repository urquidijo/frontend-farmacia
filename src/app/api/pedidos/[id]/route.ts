import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type PedidoParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: PedidoParams) {
  const { id } = await context.params;
  const res = await fetch(`${API_URL}/pedidos/${id}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  });
  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
