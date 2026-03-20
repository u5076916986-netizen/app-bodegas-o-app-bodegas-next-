import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

interface Plan {
    type: "create" | "update" | "delete";
    target: "producto" | "promo" | "pedido";
    payload: Record<string, unknown>;
}

interface RequestBody {
    bodegaId?: string;
    plan?: Plan[];
}

interface ApplyResult {
    success: boolean;
    action: string;
    target: string;
    id?: string;
    error?: string;
}

async function applyPlan(bodegaId: string, plan: Plan[]): Promise<ApplyResult[]> {
    const results: ApplyResult[] = [];

    for (const action of plan) {
        try {
            // ── PRODUCTO ──────────────────────────────────────────────────────
            if (action.target === "producto") {
                if (action.type === "create") {
                    const id = (action.payload.id as string) || `PROD_IA_${Date.now()}`;
                    const producto = await prisma.producto.create({
                        data: {
                            id,
                            bodegaId,
                            nombre: String(action.payload.nombre ?? "Producto sin nombre"),
                            sku: String(action.payload.sku ?? id),
                            categoria: String(action.payload.categoria ?? "OTROS"),
                            precio: Number(action.payload.precio ?? 0),
                            stock: Number(action.payload.stock ?? 0),
                            descripcion: action.payload.descripcion
                                ? String(action.payload.descripcion)
                                : null,
                            activo: true,
                        },
                    });
                    results.push({ success: true, action: "create", target: "producto", id: producto.id });

                } else if (action.type === "update") {
                    const id = String(action.payload.id ?? "");
                    if (!id) throw new Error("id requerido para update de producto");

                    const updateData: Record<string, unknown> = {};
                    if (action.payload.nombre)      updateData.nombre     = String(action.payload.nombre);
                    if (action.payload.precio)       updateData.precio     = Number(action.payload.precio);
                    if (action.payload.stock !== undefined) updateData.stock = Number(action.payload.stock);
                    if (action.payload.categoria)    updateData.categoria  = String(action.payload.categoria);
                    if (action.payload.descripcion)  updateData.descripcion = String(action.payload.descripcion);
                    if (action.payload.activo !== undefined) updateData.activo = Boolean(action.payload.activo);

                    await prisma.producto.updateMany({
                        where: { id, bodegaId },
                        data: updateData,
                    });
                    results.push({ success: true, action: "update", target: "producto", id });

                } else if (action.type === "delete") {
                    const id = String(action.payload.id ?? "");
                    if (!id) throw new Error("id requerido para delete de producto");
                    // Soft delete: desactivar en lugar de borrar
                    await prisma.producto.updateMany({
                        where: { id, bodegaId },
                        data: { activo: false },
                    });
                    results.push({ success: true, action: "delete", target: "producto", id });
                }

            // ── PROMO ─────────────────────────────────────────────────────────
            } else if (action.target === "promo") {
                if (action.type === "create") {
                    const id = `PROMO_IA_${Date.now()}`;
                    const hoy = new Date();
                    const fin = new Date(hoy);
                    fin.setDate(fin.getDate() + Number(action.payload.duracion_dias ?? 7));

                    const promo = await prisma.promocion.create({
                        data: {
                            id,
                            bodegaId,
                            nombre: String(action.payload.nombre ?? "Promoción IA"),
                            tipo: String(action.payload.tipo ?? "porcentaje"),
                            valor: Number(action.payload.valor ?? 10),
                            fechaInicio: hoy,
                            fechaFin: fin,
                            aplicaA: String(action.payload.aplicaA ?? "todos"),
                            categoriaProductos: (action.payload.categorias ?? []) as string[],
                            productosIds: (action.payload.productosIds ?? []) as string[],
                            estado: "activa",
                        },
                    });
                    results.push({ success: true, action: "create", target: "promo", id: promo.id });

                } else if (action.type === "update") {
                    const id = String(action.payload.id ?? "");
                    if (!id) throw new Error("id requerido para update de promo");
                    const updateData: Record<string, unknown> = {};
                    if (action.payload.nombre) updateData.nombre = String(action.payload.nombre);
                    if (action.payload.valor)  updateData.valor  = Number(action.payload.valor);
                    if (action.payload.estado) updateData.estado = String(action.payload.estado);
                    await prisma.promocion.updateMany({ where: { id, bodegaId }, data: updateData });
                    results.push({ success: true, action: "update", target: "promo", id });

                } else if (action.type === "delete") {
                    const id = String(action.payload.id ?? "");
                    if (!id) throw new Error("id requerido para delete de promo");
                    await prisma.promocion.updateMany({
                        where: { id, bodegaId },
                        data: { estado: "finalizada" },
                    });
                    results.push({ success: true, action: "delete", target: "promo", id });
                }

            // ── PEDIDO ────────────────────────────────────────────────────────
            } else if (action.target === "pedido") {
                if (action.type === "update") {
                    const id = String(action.payload.id ?? "");
                    if (!id) throw new Error("id requerido para update de pedido");
                    const updateData: Record<string, unknown> = {};
                    if (action.payload.estado) updateData.estado = String(action.payload.estado);
                    if (action.payload.notas)  updateData.notas  = String(action.payload.notas);
                    await prisma.pedido.updateMany({ where: { id, bodegaId }, data: updateData });
                    results.push({ success: true, action: "update", target: "pedido", id });
                } else {
                    results.push({ success: false, action: action.type, target: "pedido", error: "Solo se soporta update de pedido" });
                }
            }
        } catch (error) {
            results.push({
                success: false,
                action: action.type,
                target: action.target,
                error: String(error),
            });
        }
    }

    return results;
}

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
        }
        const userRole = token.rol as string;
        if (!["ADMIN", "BODEGUERO"].includes(userRole)) {
            return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
        }

        const body = (await request.json()) as RequestBody;
        const { bodegaId, plan } = body;

        if (!bodegaId || !plan || !Array.isArray(plan)) {
            return NextResponse.json(
                { ok: false, error: "bodegaId y plan (array) son requeridos" },
                { status: 400 },
            );
        }

        // Si es BODEGUERO, verificar que el bodegaId le pertenece
        if (userRole === "BODEGUERO" && token.bodegaId && token.bodegaId !== bodegaId) {
            return NextResponse.json({ ok: false, error: "Sin permiso para esta bodega" }, { status: 403 });
        }

        if (plan.length === 0) {
            return NextResponse.json({ ok: false, error: "El plan debe contener al menos una acción" }, { status: 400 });
        }

        const results = await applyPlan(bodegaId, plan);
        const allSuccessful = results.every((r) => r.success);

        return NextResponse.json({
            ok: allSuccessful,
            data: {
                bodegaId,
                actionsApplied: results.filter((r) => r.success).length,
                actionsFailed: results.filter((r) => !r.success).length,
                results,
                message: `${results.filter((r) => r.success).length}/${results.length} acciones aplicadas`,
            },
        }, { status: allSuccessful ? 200 : 207 });
    } catch (error) {
        console.error("Error en /api/ia/apply:", error);
        return NextResponse.json({ ok: false, error: "Error aplicando el plan" }, { status: 500 });
    }
}
