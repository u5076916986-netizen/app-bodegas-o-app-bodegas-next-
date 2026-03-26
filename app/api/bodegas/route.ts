import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    const bodegasPath = path.join(process.cwd(), 'data', 'bodegas.csv');
    const csv = await fs.readFile(bodegasPath, 'utf-8');
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const bodegas = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: Record<string, string | undefined> = {};
        headers.forEach((h, i) => {
            obj[h.trim()] = values[i]?.trim();
        });
        return obj;
    });
    return NextResponse.json({ bodegas });
}
