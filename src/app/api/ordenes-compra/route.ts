import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    params.append(key, value);
  });

  const res = await fetch(`${API_URL}/ordenes-compra?${params.toString()}`, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API_URL}/ordenes-compra`, {
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
