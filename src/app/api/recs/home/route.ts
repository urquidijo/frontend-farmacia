import type { NextRequest } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

// 🔹 GET /api/recs/home?userId=...
export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${apiBase}/recs/home?${qs}`, {
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
