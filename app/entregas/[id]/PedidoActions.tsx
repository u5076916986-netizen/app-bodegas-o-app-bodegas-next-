"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

const timeline = ["nuevo", "confirmado", "asignado", "en_bodega", "recogido", "en_ruta", "entregado"] as const;

type PedidoEstado = (typeof timeline)[number] | "cancelado";

type PedidoActionsProps = {
    id: string;
    estado: string;
    repartidorId?: string | null;
    onUpdated?: (pedido: any) => void;
};

export default function PedidoActions({ id, estado, repartidorId, onUpdated }: PedidoActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [problemOpen, setProblemOpen] = useState(false);
    const [problemReason, setProblemReason] = useState("cliente_no_responde");
    const [problemDetail, setProblemDetail] = useState("");
    const [problemStatus, setProblemStatus] = useState<string | null>(null);

    const currentEstado = (estado || "nuevo") as PedidoEstado;

    const handleUpdate = async (nextEstado: PedidoEstado) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pedidos/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nextEstado }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error || "No se pudo actualizar el estado");
                return;
            }

            const data = await res.json();
            onUpdated?.(data?.pedido);
            router.refresh();
        } catch (err) {
            console.error("Error actualizando estado:", err);
            setError("Error de red al actualizar el estado");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("¿Deseas cancelar este pedido?")) return;
        await handleUpdate("cancelado");
    };

    const handleProblem = async () => {
        setProblemStatus(null);
        if (!problemReason) {
            setProblemStatus("Selecciona un motivo.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/incidencias", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pedidoId: id,
                    repartidorId,
                    estado: currentEstado,
                    motivo: problemReason,
                    detalle: problemDetail || null,
                    source: "repartidor",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setProblemStatus(data?.error || "No se pudo registrar la incidencia");
                return;
            }

            setProblemStatus("Incidencia registrada");
            setProblemOpen(false);
            setProblemDetail("");
        } catch (err) {
            setProblemStatus("Error de red al registrar la incidencia");
        } finally {
            setLoading(false);
        }
    };

    const isFinal = currentEstado === "entregado" || currentEstado === "cancelado";

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Estado del pedido</h2>
                {currentEstado === "cancelado" ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Cancelado
                    </span>
                ) : null}
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                {timeline.map((step, index) => {
                    const stepIndex = timeline.indexOf(step);
                    const currentIndex = timeline.indexOf(currentEstado as any);
                    const isActive = currentIndex >= stepIndex && currentEstado !== "cancelado";

                    return (
                        <div key={step} className="flex items-center gap-2">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                                    }`}
                            >
                                {step.replace("_", " ")}
                            </span>
                            {index < timeline.length - 1 ? (
                                <span className="text-slate-300">→</span>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                {currentEstado === "nuevo" ? (
                    <button
                        onClick={() => handleUpdate("confirmado")}
                        disabled={loading}
                        className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        Confirmar
                    </button>
                ) : null}

                {currentEstado === "confirmado" ? (
                    <button
                        onClick={() => handleUpdate("asignado")}
                        disabled={loading}
                        className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                        Aceptar entrega
                    </button>
                ) : null}

                {currentEstado === "asignado" ? (
                    <button
                        onClick={() => handleUpdate("en_bodega")}
                        disabled={loading}
                        className="px-5 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                    >
                        Llegué a bodega
                    </button>
                ) : null}

                {currentEstado === "en_bodega" ? (
                    <button
                        onClick={() => handleUpdate("recogido")}
                        disabled={loading}
                        className="px-5 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                    >
                        Recogido
                    </button>
                ) : null}

                {currentEstado === "recogido" ? (
                    <button
                        onClick={() => handleUpdate("en_ruta")}
                        disabled={loading}
                        className="px-5 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
                    >
                        Iniciar ruta
                    </button>
                ) : null}

                {currentEstado === "en_ruta" ? (
                    <button
                        onClick={() => handleUpdate("entregado")}
                        disabled={loading}
                        className="px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                    >
                        Marcar entregado
                    </button>
                ) : null}

                {!isFinal ? (
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-5 py-3 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                ) : null}

                {!isFinal ? (
                    <button
                        type="button"
                        onClick={() => setProblemOpen(true)}
                        disabled={loading}
                        className="px-5 py-3 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-50 disabled:opacity-60"
                    >
                        Problema
                    </button>
                ) : null}

                {loading ? (
                    <span className="text-sm text-slate-500">Actualizando...</span>
                ) : null}
            </div>

            {error ? (
                <p className="text-sm text-red-600 mt-3">{error}</p>
            ) : null}

            <Modal
                isOpen={problemOpen}
                title="Reportar problema"
                onClose={() => setProblemOpen(false)}
                onConfirm={handleProblem}
                confirmText="Registrar"
                confirmDisabled={loading}
            >
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">
                        Motivo
                        <select
                            value={problemReason}
                            onChange={(e) => setProblemReason(e.target.value)}
                            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="cliente_no_responde">Cliente no responde</option>
                            <option value="direccion_incorrecta">Dirección incorrecta</option>
                            <option value="pedido_incompleto">Pedido incompleto</option>
                            <option value="problema_pago">Problema con el pago</option>
                            <option value="otro">Otro</option>
                        </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                        Detalle (opcional)
                        <textarea
                            value={problemDetail}
                            onChange={(e) => setProblemDetail(e.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Describe brevemente el problema"
                        />
                    </label>
                    {problemStatus ? (
                        <p className="text-xs text-amber-700">{problemStatus}</p>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
}
