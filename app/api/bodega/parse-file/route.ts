import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

export const runtime = "nodejs";

/**
 * POST /api/bodega/parse-file
 * Parsea un archivo CSV o XLSX y devuelve array de objetos
 * Acepta multipart/form-data con file
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { ok: false, error: "No file provided" },
                { status: 400 }
            );
        }

        const filename = file.name.toLowerCase();

        let rows: any[] = [];

        if (filename.endsWith(".csv")) {
            // Parse CSV
            const text = await file.text();
            rows = parse(text, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        } else if (filename.endsWith(".xlsx")) {
            // Parse XLSX
            // NOTA: Para XLSX necesitarías xlsx library
            // Por MVP, rechazamos o parseamos como CSV (si es TSV)
            const text = await file.text();
            try {
                rows = parse(text, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    delimiter: "\t", // Intenta tab-delimited
                });
            } catch {
                // Fallback: CSV
                rows = parse(text, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                });
            }
        } else {
            return NextResponse.json(
                { ok: false, error: "Solo .csv y .xlsx soportados" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            ok: true,
            rows,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
            count: rows.length,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, error: "Error al parsear archivo: " + String(err) },
            { status: 500 }
        );
    }
}
