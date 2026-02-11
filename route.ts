import { NextResponse } from "next/server";
import { readIaConfig } from "@/lib/iaConfig";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
    try {
        const config = await readIaConfig();

        if (!config.ia_enabled) {
            return NextResponse.json({
                ok: true,
                message: "IA desactivada por el administrador.",
                recommendations: []
            });
        }

        const formData = await request.formData();
        const nombreTienda = formData.get("nombre_tienda") as string;
        const location = formData.get("location") as string;
        // const notes = formData.get("notes") as string;
        const photo = formData.get("photo") as File | null;

        let savedPath = null;

        // Procesar y guardar la imagen si existe
        if (photo && typeof photo === "object" && photo.size > 0) {
            const buffer = Buffer.from(await photo.arrayBuffer());

            // Asegurar que el directorio existe
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // Ignorar si ya existe
            }

            // Nombre de archivo seguro
            const filename = `${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
            const filepath = path.join(uploadDir, filename);

            await writeFile(filepath, buffer);
            savedPath = `/uploads/${filename}`;
        }

        // Stub de respuesta estructurada
        const responseData = {
            ok: true,
            resumen: `Análisis preliminar para ${nombreTienda || "su tienda"}${location ? ` en ${location}` : ""}. Se detectan oportunidades de mejora en la exhibición y organización.`,
            recomendaciones: config.analysis_goals.length > 0 ? config.analysis_goals : ["Mejorar iluminación", "Ordenar productos"],
            mejoras: [
                {
                    categoria: "Visibilidad",
                    items: ["Limpiar vitrinas principales", "Aumentar iluminación LED en estanterías"]
                },
                {
                    categoria: "Distribución",
                    items: ["Despejar pasillos de cajas u objetos", "Ubicar productos gancho al fondo"]
                }
            ],
            etiquetas: ["Bodega", "Viveres", "Orden", "Iluminación"]
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error en /api/ia/tienda:", error);
        return NextResponse.json({ ok: false, error: "Error interno al procesar la solicitud." }, { status: 500 });
    }
}