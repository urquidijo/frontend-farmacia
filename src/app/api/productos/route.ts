import { NextRequest, NextResponse } from "next/server";
import { productoSchema } from "@/lib/validations/producto";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`, {
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

    const productos = await response.json();
    return NextResponse.json(Array.isArray(productos) ? productos : []);
  } catch (error) {
    console.error("Error fetching productos:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = productoSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorBody = await response.json();
        return NextResponse.json(errorBody, { status: response.status });
      } else {
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || "Error desconocido del servidor" },
          { status: response.status }
        );
      }
    }

    const newProducto = await response.json();
    return NextResponse.json(newProducto, { status: 201 });
  } catch (error) {
    console.error("Error creating producto:", error);
    
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as any;
      const errorMessages = zodError.issues.map((issue: unknown) => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      
      return NextResponse.json(
        { error: `Datos inválidos: ${errorMessages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}