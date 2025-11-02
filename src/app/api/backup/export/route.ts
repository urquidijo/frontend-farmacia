// app/api/backup/export/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";            // evita Edge (no tiene stream estable)
export const dynamic = "force-dynamic";     // no cachear
export const fetchCache = "force-no-store"; // idem

export async function GET(req: NextRequest) {
  const base = process.env.NEST_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    return NextResponse.json({ message: "NEST_API_URL no configurada" }, { status: 500 });
  }

  // ⚠️ Asegúrate que NEST_API_URL termine en /api
  // e.g. https://backend-farmacia-production.up.railway.app/api
  const { search } = new URL(req.url);
  const upstream = `${base.replace(/\/+$/,"")}/backup/export${search}`;

  const res = await fetch(upstream, {
    method: "GET",
    headers: {
      // pasa cookie o auth si corresponde
      cookie: req.headers.get("cookie") ?? "",
    },
    cache: "no-store",
    redirect: "follow",
    // (no body en GET, no hace falta 'duplex')
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { message: text || "Error obteniendo backup" },
      { status: res.status || 500 }
    );
  }

  // Copia headers de descarga
  const headers = new Headers();
  const cd = res.headers.get("content-disposition");
  const ct = res.headers.get("content-type") || "application/octet-stream";
  if (cd) headers.set("content-disposition", cd);
  headers.set("content-type", ct);
  headers.set("cache-control", "no-cache");
  headers.set("pragma", "no-cache");
  headers.set("x-accel-buffering", "no"); // desactiva buffering intermedio

  return new NextResponse(res.body as ReadableStream<Uint8Array>, {
    status: 200,
    headers,
  });
}
