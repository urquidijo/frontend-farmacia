import { NextRequest, NextResponse } from "next/server";
import { unidadSchema } from "@/lib/validations/unidad";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/unidades`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      throw new Error(`Error: ${response.status}`);
    }

    const unidades = await response.json();
    return NextResponse.json(Array.isArray(unidades) ? unidades : []);
  } catch (error) {
    console.error("Error fetching unidades:", error);
    return NextResponse.json(
      { error: "Error al obtener las unidades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = unidadSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/unidades`, {
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

    const newUnidad = await response.json();
    return NextResponse.json(newUnidad, { status: 201 });
  } catch (error) {
    console.error("Error creating unidad:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la unidad" },
      { status: 500 }
    );
  }
}