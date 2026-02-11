"use client";

import { useState } from "react";

type CopyActionsProps = {
    pedidoId: string;
    trackingCode?: string | null;
    direccion?: string | null;
};

export default function CopyActions({ pedidoId, trackingCode, direccion }: CopyActionsProps) {
    const [status, setStatus] = useState<string | null>(null);

    const copyText = async (label: string, value: string) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = value;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
            setStatus(`${label} copiado`);
            window.setTimeout(() => setStatus(null), 2000);
        } catch {
            setStatus("No se pudo copiar");
            window.setTimeout(() => setStatus(null), 2000);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={() => copyText("ID", pedidoId)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
                Copiar ID
            </button>
            {trackingCode ? (
                <button
                    type="button"
                    onClick={() => copyText("Tracking", trackingCode)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Copiar tracking
                </button>
            ) : null}
            {direccion ? (
                <button
                    type="button"
                    onClick={() => copyText("Direccion", direccion)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Copiar direccion
                </button>
            ) : null}
            {status ? <span className="text-xs text-slate-500">{status}</span> : null}
        </div>
    );
}
