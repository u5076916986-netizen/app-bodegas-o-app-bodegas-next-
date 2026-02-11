import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

// POST: Subir foto de tienda
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const email = formData.get('email') as string;

        if (!file || !email) {
            return NextResponse.json(
                { error: 'Archivo y email requeridos' },
                { status: 400 }
            );
        }

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Solo se permiten imágenes' },
                { status: 400 }
            );
        }

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'El archivo no debe superar 5MB' },
                { status: 400 }
            );
        }

        // Crear hash del email para nombre de archivo
        const emailHash = crypto.createHash('md5').update(email).digest('hex');
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${emailHash}.${extension}`;

        // Crear directorio si no existe
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tenderos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Guardar archivo
        const filepath = path.join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(filepath, buffer);

        // Ruta pública
        const publicPath = `/uploads/tenderos/${filename}`;

        return NextResponse.json({
            ok: true,
            url: publicPath,
        });
    } catch (error) {
        console.error('Error en POST /api/upload/foto-tienda:', error);
        return NextResponse.json(
            { error: 'Error al subir archivo' },
            { status: 500 }
        );
    }
}
