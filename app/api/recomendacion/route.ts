import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

interface Producto {
    id: string;
    bodegaId: string;
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo: boolean;
    descripcion?: string;
}

interface Pedido {
    pedidoId: string;
    bodegaId: string;
    items: {
        productoId: string;
        nombre: string;
        precio_cop: number;
        cantidad: number;
    }[];
    datosEntrega?: {
        nombre?: string;
    };
}

interface RecommendationResponse {
    product: {
        id: string;
        nombre: string;
        precio: number;
        categoria: string;
        stock: number;
    } | null;
    reason: string;
    confidence: number;
}

// Feature flag para IA (preparado para futuro)
const USE_AI = process.env.USE_AI_RECOMMENDATION === "true";

// Función stub para IA futura
async function getAIRecommendation(input: {
    tenderoId?: string;
    bodegaId?: string;
    historial: Pedido[];
    productos: Producto[];
}): Promise<RecommendationResponse | null> {
    // TODO: Implementar llamada a servicio de IA
    // Por ahora retorna null para usar el sistema de reglas
    console.log('[AI Stub] Llamada preparada pero no implementada', {
        tenderoCount: input.historial.length,
        productCount: input.productos.length
    });
    return null;
}

async function readPedidos(): Promise<Pedido[]> {
    try {
        const pedidosPath = join(process.cwd(), 'data', 'pedidos.json');
        if (!existsSync(pedidosPath)) return [];
        const content = await readFile(pedidosPath, 'utf-8');
        return JSON.parse(content) as Pedido[];
    } catch (error) {
        console.error('Error reading pedidos:', error);
        return [];
    }
}

async function readProductos(): Promise<Producto[]> {
    try {
        const productosPath = join(process.cwd(), 'data', 'productos.json');
        if (!existsSync(productosPath)) return [];
        const content = await readFile(productosPath, 'utf-8');
        return JSON.parse(content) as Producto[];
    } catch (error) {
        console.error('Error reading productos:', error);
        return [];
    }
}

async function readRecommendationsMap(): Promise<Record<string, string[]>> {
    try {
        const mapPath = join(process.cwd(), 'data', 'recomendaciones_map.json');
        if (!existsSync(mapPath)) return {};
        const content = await readFile(mapPath, 'utf-8');
        return JSON.parse(content) as Record<string, string[]>;
    } catch (error) {
        console.error('Error reading recommendations map:', error);
        return {};
    }
}

function getRecommendationByRules(
    tenderoId: string | null,
    bodegaId: string | null,
    pedidos: Pedido[],
    productos: Producto[],
    recMap: Record<string, string[]>
): RecommendationResponse {
    // Filtrar productos activos con stock
    const productosDisponibles = productos.filter(p => p.activo && p.stock > 0);

    if (!productosDisponibles.length) {
        return {
            product: null,
            reason: 'No hay productos disponibles en este momento',
            confidence: 0
        };
    }

    // Si hay bodegaId, filtrar por bodega
    const productosBodega = bodegaId
        ? productosDisponibles.filter(p => p.bodegaId === bodegaId)
        : productosDisponibles;

    if (!productosBodega.length) {
        return {
            product: null,
            reason: 'No hay productos disponibles para esta bodega',
            confidence: 0
        };
    }

    // Filtrar historial del tendero
    const pedidosTendero = tenderoId
        ? pedidos.filter(p => p.datosEntrega?.nombre?.toLowerCase() === tenderoId.toLowerCase())
        : [];

    // Si hay historial, recomendar producto complementario
    if (pedidosTendero.length > 0) {
        // Mapear categorías más compradas
        const categoriasCompradas: Record<string, number> = {};
        pedidosTendero.forEach(pedido => {
            pedido.items.forEach(item => {
                // Buscar el producto para obtener su categoría
                const producto = productos.find(p => p.id === item.productoId || p.nombre === item.nombre);
                if (producto && producto.categoria) {
                    categoriasCompradas[producto.categoria] = (categoriasCompradas[producto.categoria] || 0) + item.cantidad;
                }
            });
        });

        // Ordenar categorías por cantidad comprada
        const categoriasOrdenadas = Object.entries(categoriasCompradas)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);

        // Buscar categorías complementarias
        for (const categoria of categoriasOrdenadas) {
            const complementarias = recMap[categoria] || [];
            for (const catComplementaria of complementarias) {
                const productoComplementario = productosBodega.find(
                    p => p.categoria === catComplementaria
                );
                if (productoComplementario) {
                    return {
                        product: {
                            id: productoComplementario.id,
                            nombre: productoComplementario.nombre,
                            precio: productoComplementario.precio,
                            categoria: productoComplementario.categoria,
                            stock: productoComplementario.stock
                        },
                        reason: `Complementa tus compras de ${categoria}`,
                        confidence: 0.75
                    };
                }
            }
        }
    }

    // Si NO hay historial o no se encontró complementario
    // Recomendar producto con mayor stock o marcado como promo
    const productoMayorStock = productosBodega.reduce((max, p) =>
        p.stock > max.stock ? p : max
    );

    return {
        product: {
            id: productoMayorStock.id,
            nombre: productoMayorStock.nombre,
            precio: productoMayorStock.precio,
            categoria: productoMayorStock.categoria,
            stock: productoMayorStock.stock
        },
        reason: tenderoId
            ? 'Popular entre otros tenderos'
            : 'Producto destacado con alta disponibilidad',
        confidence: 0.5
    };
}

// GET /api/recomendacion?tenderoId=...&bodegaId=...
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tenderoId = searchParams.get('tenderoId');
        const bodegaId = searchParams.get('bodegaId');

        // Leer datos
        const [pedidos, productos, recMap] = await Promise.all([
            readPedidos(),
            readProductos(),
            readRecommendationsMap()
        ]);

        let recommendation: RecommendationResponse | null = null;

        // Intentar usar IA si está habilitada
        if (USE_AI) {
            recommendation = await getAIRecommendation({
                tenderoId: tenderoId || undefined,
                bodegaId: bodegaId || undefined,
                historial: pedidos,
                productos
            });
        }

        // Si IA no está disponible o no retornó resultado, usar reglas
        if (!recommendation) {
            recommendation = getRecommendationByRules(
                tenderoId,
                bodegaId,
                pedidos,
                productos,
                recMap
            );
        }

        return NextResponse.json({
            ok: true,
            ...recommendation
        });
    } catch (error) {
        console.error('Error in GET /api/recomendacion:', error);
        return NextResponse.json(
            {
                ok: false,
                product: null,
                reason: 'Error al generar recomendación',
                confidence: 0
            },
            { status: 500 }
        );
    }
}
