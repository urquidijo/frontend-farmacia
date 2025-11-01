import type { NextRequest } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_URL!;

// POST /api/rx/verify  ->  Nest: /rx/verify
export async function POST(req: NextRequest) {
  const xUserId = req.headers.get("x-user-id") ?? "";
  const body = await req.json().catch(() => ({})); // { imageBase64 }

  const res = await fetch(`${apiBase}/rx/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
      ...(xUserId ? { "x-user-id": xUserId } : {}),
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
