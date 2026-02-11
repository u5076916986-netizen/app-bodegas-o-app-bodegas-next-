"use client";

import { useMemo, useState } from "react";

interface Plan {
    type: "create" | "update" | "delete";
    target: "producto" | "promo" | "pedido";
    payload: Record<string, unknown>;
}

interface IaResponse {
    summary: string;
    plan: Plan[];
    requiresApproval: boolean;
}

interface IaClientProps {
    bodegaId: string;
}

export default function IaClient({ bodegaId }: IaClientProps) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<IaResponse | null>(null);
    const [approving, setApproving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const templates = [
        "Crear 3 productos de aseo con precios entre 8.000 y 12.000",
        "Aumentar stock de arroz y frijol a 100 unidades",
        "Crear promoción 20% en bebidas por 7 días",
        "Eliminar productos sin rotación de la categoría licores",
    ];

    const planSummary = useMemo(() => {
        if (!response?.plan?.length) return null;
        const totals = response.plan.reduce(
            (acc, action) => {
                acc[action.type] += 1;
                return acc;
            },
            { create: 0, update: 0, delete: 0 },
        );
        return totals;
    }, [response]);

    const handleAnalyze = async () => {
        if (!message.trim()) {
            setError("Por favor ingresa un mensaje");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResponse(null);
            setSuccessMsg(null);

            const res = await fetch("/api/ia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bodegaId, message }),
            });

            const data = await res.json();

            if (!data.ok) {
                setError(data.error || "Error analizando mensaje");
                return;
            }

            setResponse(data.data);
        } catch (err) {
            setError("Error conectando con la IA");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!response || !response.plan.length) return;

        try {
            setApproving(true);
            setError(null);

            const res = await fetch("/api/ia/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bodegaId,
                    plan: response.plan,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                setError(data.error || "Error aplicando plan");
                return;
            }

            setError(null);
            setMessage("");
            setResponse(null);
            setSuccessMsg("Plan aplicado exitosamente");
        } catch (err) {
            setError("Error aplicando plan");
        } finally {
            setApproving(false);
        }
    };

    const handleCancel = () => {
        setResponse(null);
        setError(null);
        setSuccessMsg(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Centro IA</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Utiliza inteligencia artificial para optimizar tu bodega
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                    <label htmlFor="ia-message" className="block text-sm font-medium text-slate-700 mb-2">
                        ¿Qué necesitas de tu bodega?
                    </label>
                    <textarea
                        id="ia-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Crear 5 productos de lácteos, aumentar stock de arroz, crear promoción de fin de mes..."
                        rows={4}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        {templates.map((template) => (
                            <button
                                key={template}
                                type="button"
                                disabled={loading}
                                onClick={() => setMessage(template)}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 disabled:opacity-60"
                            >
                                {template}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Sé específico. Describe qué cambios quieres hacer en tu inventario o operaciones.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{message.trim().length} caracteres</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !message.trim()}
                        className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Analizando..." : "Analizar"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMessage("");
                            setResponse(null);
                            setError(null);
                            setSuccessMsg(null);
                        }}
                        disabled={loading}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
                    {successMsg}
                </div>
            )}

            {/* Response Section */}
            {response && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-2">Resumen</h2>
                        <p className="text-blue-800">{response.summary}</p>
                        {planSummary ? (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                {planSummary.create > 0 ? (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                                        {planSummary.create} crear
                                    </span>
                                ) : null}
                                {planSummary.update > 0 ? (
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                                        {planSummary.update} actualizar
                                    </span>
                                ) : null}
                                {planSummary.delete > 0 ? (
                                    <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                                        {planSummary.delete} eliminar
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    {/* Plan */}
                    {response.plan.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900">Acciones Sugeridas</h2>

                            <div className="space-y-3">
                                {response.plan.map((action, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-md border border-slate-200"
                                    >
                                        {/* Icon/Type */}
                                        <div
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${action.type === "create"
                                                ? "bg-green-500"
                                                : action.type === "update"
                                                    ? "bg-blue-500"
                                                    : "bg-red-500"
                                                }`}
                                        >
                                            {action.type === "create" ? "+" : action.type === "update" ? "✎" : "−"}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-slate-900 capitalize">
                                                {action.type === "create" && "Crear"}
                                                {action.type === "update" && "Actualizar"}
                                                {action.type === "delete" && "Eliminar"}
                                                {" "}
                                                {action.target === "producto" && "Producto"}
                                                {action.target === "promo" && "Promoción"}
                                                {action.target === "pedido" && "Pedido"}
                                            </div>
                                            <details className="mt-1">
                                                <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-900">
                                                    Ver detalles
                                                </summary>
                                                <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto max-h-40">
                                                    {JSON.stringify(action.payload, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Approval Buttons */}
                            {response.requiresApproval && (
                                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={handleApprove}
                                        disabled={approving}
                                        className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        {approving ? "Aplicando..." : "Aprobar Plan"}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={approving}
                                        className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No plan message */}
                    {response.plan.length === 0 && (
                        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
                            No se generaron acciones para este mensaje. Intenta ser más específico.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
