"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

type RouteActionProps = {
    pedidoId: string;
    direccion?: string | null;
    zona?: string | null;
};

export default function RouteAction({ pedidoId, direccion, zona }: RouteActionProps) {
    const [open, setOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const hasDireccion = Boolean(direccion && direccion.trim().length > 0);
    const mapsUrl = hasDireccion
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion as string)}`
        : "";

    const handleCopyAddress = async () => {
        if (!hasDireccion) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(direccion as string);
            } else {
                const el = document.createElement("textarea");
                el.value = direccion as string;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            }
            setCopyStatus("Dirección copiada");
        } catch {
            setCopyStatus("No se pudo copiar");
        }
    };

    return (
        <div className="mt-4 space-y-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold">📍 {direccion || "Dirección no disponible"}</p>
                {zona ? <p className="text-[11px] text-slate-500">Zona/Barrio: {zona}</p> : null}
            </div>

            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={!hasDireccion}
                title={!hasDireccion ? "Falta dirección del cliente" : ""}
                className={`w-full rounded-2xl border px-3 py-2 text-left text-xs font-semibold ${hasDireccion
                        ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
            >
                <span className="block">Ir a la ruta</span>
                <span className="block text-[10px] font-normal text-slate-500">
                    Abre Google Maps con la dirección
                </span>
            </button>

            {!hasDireccion ? (
                <Link
                    href="/repartidor/entregas"
                    className="inline-flex rounded-full border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                >
                    Reportar problema
                </Link>
            ) : null}

            <Modal
                isOpen={open}
                title="Abrir navegación"
                onClose={() => setOpen(false)}
                cancelText="Cancelar"
                confirmText="Abrir Google Maps"
                onConfirm={() => {
                    if (!hasDireccion) return;
                    window.open(mapsUrl, "_blank", "noopener,noreferrer");
                    setOpen(false);
                }}
            >
                <div className="space-y-3 text-sm text-slate-700">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pedido</p>
                        <p className="font-mono text-xs text-slate-600">{pedidoId}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dirección</p>
                        <p className="font-semibold text-slate-900">{direccion || "Sin dirección"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyAddress}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Copiar dirección
                        </button>
                        {copyStatus ? <span className="text-xs text-slate-500">{copyStatus}</span> : null}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
