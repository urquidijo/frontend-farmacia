import { NextRequest, NextResponse } from "next/server";
import { categoriaSchema } from "@/lib/validations/categoria";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
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

    const categorias = await response.json();
    return NextResponse.json(Array.isArray(categorias) ? categorias : []);
  } catch (error) {
    console.error("Error fetching categorias:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = categoriaSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/categorias`, {
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

    const newCategoria = await response.json();
    return NextResponse.json(newCategoria, { status: 201 });
  } catch (error) {
    console.error("Error creating categoria:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}