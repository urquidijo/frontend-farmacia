// app/api/backup/export/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // streaming con Node

export async function GET(req: NextRequest) {
  const nestBase = process.env.NEST_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!nestBase) {
    return NextResponse.json({ message: "NEST_API_URL no configurada" }, { status: 500 });
  }

  const { search } = new URL(req.url);
  const upstream = `${nestBase}/backup/export${search}`;

  const res = await fetch(upstream, {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    // cache: "no-store", // opcional si no quieres cache
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { message: text || "Error obteniendo backup" },
      { status: res.status || 500 }
    );
  }

  // Pasar stream y headers para descarga
  const headers = new Headers();
  const cd = res.headers.get("content-disposition");
  const ct = res.headers.get("content-type") || "application/octet-stream";
  if (cd) headers.set("content-disposition", cd);
  headers.set("content-type", ct);

  // res.body ya validado: no es null
  const body = res.body as ReadableStream<Uint8Array>; // o simplemente: res.body!

  return new NextResponse(body, {
    status: 200,
    headers,
  });
}
