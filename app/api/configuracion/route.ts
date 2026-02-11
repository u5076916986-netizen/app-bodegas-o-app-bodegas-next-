import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface Configuracion {
    sistema: {
        refreshRecomendacionMin: number;
        modoRecomendacion: 'reglas' | 'ia';
    };
    entregas: {
        costoBaseEnvio: number;
        umbralEntregaRapidaMin: number;
    };
    roles: {
        activarAdmin: boolean;
        activarRepartidor: boolean;
        activarBodega: boolean;
        activarTendero: boolean;
    };
}

const defaultConfig: Configuracion = {
    sistema: {
        refreshRecomendacionMin: 10,
        modoRecomendacion: 'reglas',
    },
    entregas: {
        costoBaseEnvio: 5000,
        umbralEntregaRapidaMin: 30,
    },
    roles: {
        activarAdmin: true,
        activarRepartidor: true,
        activarBodega: true,
        activarTendero: true,
    },
};

const configPath = path.join(process.cwd(), 'data', 'configuracion.json');

function ensureConfigExists(): Configuracion {
    try {
        if (!fs.existsSync(configPath)) {
            const dir = path.dirname(configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
            return defaultConfig;
        }
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading config:', error);
        return defaultConfig;
    }
}

// GET: Obtener configuración
export async function GET() {
    try {
        const config = ensureConfigExists();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Error en GET /api/configuracion:', error);
        return NextResponse.json(
            { error: 'Error al leer configuración' },
            { status: 500 }
        );
    }
}

// POST: Guardar configuración
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar estructura
        if (!body.sistema || !body.entregas || !body.roles) {
            return NextResponse.json(
                { error: 'Estructura de configuración inválida' },
                { status: 400 }
            );
        }

        // Validar tipos Sistema
        if (
            typeof body.sistema.refreshRecomendacionMin !== 'number' ||
            body.sistema.refreshRecomendacionMin < 1 ||
            body.sistema.refreshRecomendacionMin > 1440
        ) {
            return NextResponse.json(
                { error: 'refreshRecomendacionMin debe ser un número entre 1 y 1440' },
                { status: 400 }
            );
        }

        if (!['reglas', 'ia'].includes(body.sistema.modoRecomendacion)) {
            return NextResponse.json(
                { error: 'modoRecomendacion debe ser "reglas" o "ia"' },
                { status: 400 }
            );
        }

        // Validar tipos Entregas
        if (
            typeof body.entregas.costoBaseEnvio !== 'number' ||
            body.entregas.costoBaseEnvio < 0
        ) {
            return NextResponse.json(
                { error: 'costoBaseEnvio debe ser un número positivo' },
                { status: 400 }
            );
        }

        if (
            typeof body.entregas.umbralEntregaRapidaMin !== 'number' ||
            body.entregas.umbralEntregaRapidaMin < 1
        ) {
            return NextResponse.json(
                { error: 'umbralEntregaRapidaMin debe ser un número positivo' },
                { status: 400 }
            );
        }

        // Validar tipos Roles
        const rolesKeys = ['activarAdmin', 'activarRepartidor', 'activarBodega', 'activarTendero'];
        for (const key of rolesKeys) {
            if (typeof body.roles[key] !== 'boolean') {
                return NextResponse.json(
                    { error: `roles.${key} debe ser un booleano` },
                    { status: 400 }
                );
            }
        }

        // Verificar campos desconocidos
        const allowedKeys = {
            sistema: ['refreshRecomendacionMin', 'modoRecomendacion'],
            entregas: ['costoBaseEnvio', 'umbralEntregaRapidaMin'],
            roles: rolesKeys,
        };

        for (const section of ['sistema', 'entregas', 'roles'] as const) {
            const extraKeys = Object.keys(body[section]).filter(
                (k) => !allowedKeys[section].includes(k)
            );
            if (extraKeys.length > 0) {
                return NextResponse.json(
                    { error: `Campos desconocidos en ${section}: ${extraKeys.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        // Guardar configuración
        const config: Configuracion = {
            sistema: {
                refreshRecomendacionMin: body.sistema.refreshRecomendacionMin,
                modoRecomendacion: body.sistema.modoRecomendacion,
            },
            entregas: {
                costoBaseEnvio: body.entregas.costoBaseEnvio,
                umbralEntregaRapidaMin: body.entregas.umbralEntregaRapidaMin,
            },
            roles: {
                activarAdmin: body.roles.activarAdmin,
                activarRepartidor: body.roles.activarRepartidor,
                activarBodega: body.roles.activarBodega,
                activarTendero: body.roles.activarTendero,
            },
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

        return NextResponse.json({
            ok: true,
            message: 'Configuración guardada exitosamente',
            config,
        });
    } catch (error) {
        console.error('Error en POST /api/configuracion:', error);
        return NextResponse.json(
            { error: 'Error al guardar configuración' },
            { status: 500 }
        );
    }
}
