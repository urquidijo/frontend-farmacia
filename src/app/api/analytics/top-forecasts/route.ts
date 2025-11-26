import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria") || "";

    const url = `${process.env.NEXT_PUBLIC_API_URL}/analytics/top-forecasts${
      categoria ? `?categoria=${categoria}` : ""
    }`;

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener pronósticos" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en /api/analytics/top-forecasts:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
