import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/categorias`;

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener categorías" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en /api/categorias:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
