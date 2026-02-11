import { NextRequest, NextResponse } from "next/server";

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
    payload: Record<string, unknown>;
}

async function applyPlan(bodegaId: string, plan: Plan[]): Promise<ApplyResult[]> {
    const results: ApplyResult[] = [];

    for (const action of plan) {
        try {
            if (action.target === "producto") {
                // Simular creación/actualización de producto
                if (action.type === "create") {
                    results.push({
                        success: true,
                        action: "create",
                        target: "producto",
                        payload: {
                            ...action.payload,
                            _applied: true,
                            _timestamp: new Date().toISOString(),
                        },
                    });
                } else if (action.type === "update") {
                    results.push({
                        success: true,
                        action: "update",
                        target: "producto",
                        payload: {
                            ...action.payload,
                            _applied: true,
                            _timestamp: new Date().toISOString(),
                        },
                    });
                } else if (action.type === "delete") {
                    results.push({
                        success: true,
                        action: "delete",
                        target: "producto",
                        payload: action.payload,
                    });
                }
            } else if (action.target === "promo") {
                // Simular creación de promoción
                results.push({
                    success: true,
                    action: action.type,
                    target: "promo",
                    payload: {
                        ...action.payload,
                        _applied: true,
                        _timestamp: new Date().toISOString(),
                    },
                });
            } else if (action.target === "pedido") {
                // Simular operación en pedido
                results.push({
                    success: true,
                    action: action.type,
                    target: "pedido",
                    payload: {
                        ...action.payload,
                        _applied: true,
                        _timestamp: new Date().toISOString(),
                    },
                });
            }
        } catch (error) {
            results.push({
                success: false,
                action: action.type,
                target: action.target,
                payload: action.payload,
            });
        }
    }

    return results;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RequestBody;
        const { bodegaId, plan } = body;

        // Validación
        if (!bodegaId || !plan || !Array.isArray(plan)) {
            return NextResponse.json(
                { ok: false, error: "bodegaId y plan (array) son requeridos" },
                { status: 400 }
            );
        }

        if (plan.length === 0) {
            return NextResponse.json(
                { ok: false, error: "El plan debe contener al menos una acción" },
                { status: 400 }
            );
        }

        // Aplicar el plan
        const results = await applyPlan(bodegaId, plan);

        // Verificar si todas las acciones fueron exitosas
        const allSuccessful = results.every((r) => r.success);

        if (!allSuccessful) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Algunas acciones fallaron al aplicarse",
                    results,
                },
                { status: 207 } // Multi-Status
            );
        }

        return NextResponse.json({
            ok: true,
            data: {
                bodegaId,
                actionsApplied: results.length,
                results,
                message: `Se aplicaron exitosamente ${results.length} acciones al plan`,
            },
        });
    } catch (error) {
        console.error("Error en /api/ia/apply:", error);
        return NextResponse.json(
            { ok: false, error: "Error aplicando el plan" },
            { status: 500 }
        );
    }
}
