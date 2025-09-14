import { NextRequest, NextResponse } from "next/server";
import { marcaSchema } from "@/lib/validations/marca";

const api = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${api}/marcas`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const marcas = await response.json();
    return NextResponse.json(marcas);
  } catch (error) {
    console.error("Error fetching marcas:", error);
    return NextResponse.json(
      { error: "Error al obtener las marcas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos con Zod
    const validatedData = marcaSchema.parse(body);

    const response = await fetch(`${api}/marcas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const newMarca = await response.json();
    return NextResponse.json(newMarca, { status: 201 });
  } catch (error) {
    console.error("Error creating marca:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la marca" },
      { status: 500 }
    );
  }
}