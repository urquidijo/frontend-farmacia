import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type ItemRouteParams = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function PATCH(
  req: NextRequest,
  context: ItemRouteParams,
) {
  const { id, itemId } = await context.params;
  const body = await req.text();
  const res = await fetch(
    `${API_URL}/ordenes-compra/${id}/items/${itemId}`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      body,
    },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function DELETE(
  req: NextRequest,
  context: ItemRouteParams,
) {
  const { id, itemId } = await context.params;
  const res = await fetch(
    `${API_URL}/ordenes-compra/${id}/items/${itemId}`,
    {
      method: 'DELETE',
      headers: { cookie: req.headers.get('cookie') ?? '' },
      credentials: 'include',
    },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
