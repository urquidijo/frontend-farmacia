// app/api/backup/restore/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const nestBase = process.env.NEST_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!nestBase) {
    return NextResponse.json({ message: "NEST_API_URL no configurada" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "Falta archivo 'file'" }, { status: 400 });
  }

  // Re-armar FormData para el upstream
  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name);

  const r = await fetch(`${nestBase}/backup/restore`, {
    method: "POST",
    body: upstreamForm,
    headers: {
      cookie: req.headers.get("cookie") ?? "",
      // fetch con FormData ya asigna content-type multipart con boundary
    },
  });

  const text = await r.text();

  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // puede no ser JSON limpio (texto plano de error o log)
  }

  if (!r.ok) {
    return NextResponse.json(
      {
        message:
          (json?.message as string) ||
          text ||
          "Error al restaurar",
      },
      { status: r.status || 500 }
    );
  }

  return NextResponse.json(json ?? { ok: true });
}
