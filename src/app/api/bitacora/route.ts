import type { NextRequest } from "next/server";

// 🧩 Usa la misma variable que en login
const apiBase = process.env.NEXT_PUBLIC_API_URL;

// ---------------- POST /api/bitacora ----------------
// Crea registro (desde front al backend Nest)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${apiBase}/bitacora`, {
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

// ---------------- GET /api/bitacora ----------------
// Lista con filtros (?userId=&estado=&desde=&hasta=&page=&perPage=)
export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${apiBase}/bitacora?${qs}`, {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    credentials: "include",
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
