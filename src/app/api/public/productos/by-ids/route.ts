import type { NextRequest } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

// 🔹 POST /api/public/productos/by-ids  { ids: number[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${apiBase}/public/productos/by-ids`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
