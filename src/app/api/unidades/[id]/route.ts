import { NextRequest, NextResponse } from "next/server";
import { unidadSchema } from "@/lib/validations/unidad";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_BASE_URL}/unidades/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Unidad no encontrada" },
          { status: 404 }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    const unidad = await response.json();
    return NextResponse.json(unidad);
  } catch (error) {
    console.error("Error fetching unidad:", error);
    return NextResponse.json(
      { error: "Error al obtener la unidad" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = unidadSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/unidades/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Unidad no encontrada" },
          { status: 404 }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    const updatedUnidad = await response.json();
    return NextResponse.json(updatedUnidad);
  } catch (error) {
    console.error("Error updating unidad:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la unidad" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_BASE_URL}/unidades/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Unidad no encontrada" },
          { status: 404 }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    return NextResponse.json({ message: "Unidad eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting unidad:", error);
    return NextResponse.json(
      { error: "Error al eliminar la unidad" },
      { status: 500 }
    );
  }
}