import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

async function readJsonData(filename: string) {
    try {
        const filePath = join(process.cwd(), "data", filename);
        const content = await readFile(filePath, "utf-8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bodegaId: string }> }
) {
    const { bodegaId } = await params;
    const data = await readJsonData("entregas.json");
    const filtered = data.filter((item: any) => item.bodegaId === bodegaId);

    return Response.json({ ok: true, data: filtered });
}
