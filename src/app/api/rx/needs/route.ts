import type { NextRequest } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_URL!;

// POST /api/rx/needs  ->  Nest: /rx/needs
export async function POST(req: NextRequest) {
  // Propaga x-user-id si el front lo envía (opcional: si tu backend usa JWT, puedes omitirlo)
  const xUserId = req.headers.get("x-user-id") ?? "";

  const res = await fetch(`${apiBase}/rx/needs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
      ...(xUserId ? { "x-user-id": xUserId } : {}),
    },
    credentials: "include",
    // esta ruta no requiere body; mandamos {} por consistencia
    body: JSON.stringify({}),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
