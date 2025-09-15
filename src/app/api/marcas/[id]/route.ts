import { NextRequest, NextResponse } from "next/server";
import { marcaSchema } from "@/lib/validations/marca";

const api = process.env.NEXT_PUBLIC_API_URL

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${api}/marcas/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Marca no encontrada" },
          { status: 404 }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    const marca = await response.json();
    return NextResponse.json(marca);
  } catch (error) {
    console.error("Error fetching marca:", error);
    return NextResponse.json(
      { error: "Error al obtener la marca" },
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
    
    // Validar datos con Zod
    const validatedData = marcaSchema.parse(body);

    const response = await fetch(`${api}/marcas/${id}`, {
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
          { error: "Marca no encontrada" },
          { status: 404 }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    const updatedMarca = await response.json();
    return NextResponse.json(updatedMarca);
  } catch (error) {
    console.error("Error updating marca:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la marca" },
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
    const response = await fetch(`${api}/marcas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Marca no encontrada" },
          { status: 404 }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    return NextResponse.json({ message: "Marca eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting marca:", error);
    return NextResponse.json(
      { error: "Error al eliminar la marca" },
      { status: 500 }
    );
  }
}