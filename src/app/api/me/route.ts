import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiBase}/me`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      credentials: "include",
      cache: "no-store",
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    throw new Error("error");
  }
}
export const runtime = "nodejs";
