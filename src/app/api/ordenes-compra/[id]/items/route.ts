import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type ItemsRouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  req: NextRequest,
  context: ItemsRouteParams,
) {
  const { id } = await context.params;
  const body = await req.text();
  const res = await fetch(`${API_URL}/ordenes-compra/${id}/items`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
