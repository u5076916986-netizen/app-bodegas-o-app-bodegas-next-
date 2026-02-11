import { NextResponse } from "next/server";
import { readIaConfig } from "@/lib/iaConfig";

type IaPayload = {
  first_name?: string;
  location?: string;
  notes?: string;
  photo_base64?: string;
};

type ExtractResult = {
  ok: boolean;
  productos?: Array<{ nombre?: string; categoria?: string; precio_cop?: number; stock?: number }>;
  error?: string;
};

const stripDataUrl = (value?: string) => {
  if (!value) return "";
  const commaIdx = value.indexOf(",");
  return commaIdx >= 0 ? value.slice(commaIdx + 1) : value;
};

export async function POST(request: Request) {
  try {
    const config = await readIaConfig();
    if (!config.ia_enabled) {
      return NextResponse.json(
        { ok: false, error: "IA deshabilitada en este momento" },
        { status: 503 },
      );
    }
    const payload = (await request.json().catch(() => ({}))) as IaPayload;
    const { first_name, location, notes, photo_base64 } = payload;
    const baseMessage = `Foto recibida de ${first_name ?? "el tendero"}${location ? ` en ${location}` : ""
      }`;
    let productosDetectados: ExtractResult | null = null;

    if (photo_base64 && process.env.OPENAI_API_KEY) {
      const imageBase64 = stripDataUrl(photo_base64);
      try {
        const url = new URL("/api/ia/extraer-productos", request.url);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64 }),
        });
        productosDetectados = (await res.json()) as ExtractResult;
      } catch {
        productosDetectados = { ok: false, error: "No fue posible leer la foto" };
      }
    }

    const productos = productosDetectados?.ok && Array.isArray(productosDetectados.productos)
      ? productosDetectados.productos
      : [];
    const productosResumen = productos.slice(0, 3).map((p) => p.nombre).filter(Boolean) as string[];
    const photoNote = photo_base64
      ? productos.length > 0
        ? `Se detectaron ${productos.length} productos en la foto${productosResumen.length ? ` (ej: ${productosResumen.join(", ")})` : ""}.`
        : "No se pudieron extraer productos claros de la foto."
      : "Sin foto adjunta.";
    const recommendations = [
      "Ilumina la vitrina izquierda para resaltar los nuevos lanzamientos.",
      "Organiza los productos por colores y mantén etiquetas visibles.",
      "Coloca el corner de ofertas junto a la entrada y limpia los pasillos.",
    ];
    return NextResponse.json({
      ok: true,
      message: `${baseMessage}. ${photoNote}`,
      recommendations,
      productosDetectados: productos.slice(0, 15),
      config_used: config,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No fue posible analizar la tienda" },
      { status: 500 },
    );
  }
}
