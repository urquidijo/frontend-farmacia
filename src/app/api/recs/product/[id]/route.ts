import type { NextRequest } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

// ✅ En Next 15, params es Promise<{ id: string }>
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 👈 importante

  const qs = req.nextUrl.searchParams.toString();
  const url = qs
    ? `${apiBase}/recs/product/${id}?${qs}`
    : `${apiBase}/recs/product/${id}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { cookie: req.headers.get("cookie") ?? "" },
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
