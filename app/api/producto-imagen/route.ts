import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface ProductImageMap {
    [key: string]: string;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const nombre = searchParams.get('nombre');

        if (!nombre) {
            return NextResponse.json(
                { error: 'Parámetro "nombre" requerido' },
                { status: 400 }
            );
        }

        // Leer el archivo de mapeo
        const dataPath = path.join(process.cwd(), 'data', 'productos_imagenes.json');
        let imageMap: ProductImageMap = {};

        try {
            const fileContent = fs.readFileSync(dataPath, 'utf-8');
            imageMap = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error leyendo productos_imagenes.json:', error);
            return NextResponse.json({
                imageUrl: '/productos/placeholder.svg',
                source: 'fallback_error'
            });
        }

        // Búsqueda 1: Match exacto
        if (imageMap[nombre]) {
            return NextResponse.json({
                imageUrl: imageMap[nombre],
                source: 'exact_match'
            });
        }

        // Búsqueda 2: Match parcial (includes)
        const nombreLower = nombre.toLowerCase();
        for (const [key, value] of Object.entries(imageMap)) {
            if (key.toLowerCase().includes(nombreLower) || nombreLower.includes(key.toLowerCase())) {
                return NextResponse.json({
                    imageUrl: value,
                    source: 'partial_match'
                });
            }
        }

        // Fallback: placeholder
        return NextResponse.json({
            imageUrl: '/productos/placeholder.svg',
            source: 'fallback_notfound'
        });

    } catch (error) {
        console.error('Error en /api/producto-imagen:', error);
        return NextResponse.json(
            {
                imageUrl: '/productos/placeholder.svg',
                source: 'error',
                error: 'Error interno del servidor'
            },
            { status: 500 }
        );
    }
}
