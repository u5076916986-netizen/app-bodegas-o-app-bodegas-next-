"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Notificacion = {
    id: string;
    bodegaId?: string | null;
    titulo: string;
    mensaje: string;
    createdAt: string;
    target: string;
};

export default function TenderoNotifications() {
    const [items, setItems] = useState<Notificacion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/notificaciones?target=tenderos", { cache: "no-store" });
                if (!res.ok) {
                    setError("No se pudieron cargar las notificaciones");
                    return;
                }
                const data = await res.json();
                if (data.ok) {
                    setItems(Array.isArray(data.data) ? data.data.slice(0, 3) : []);
                }
            } catch (err) {
                setError("No se pudieron cargar las notificaciones");
            }
        };
        load();
    }, []);

    const visibleItems = useMemo(
        () => items.filter((item) => !dismissed[item.id]),
        [items, dismissed],
    );

    const getPedidoId = (text: string) => {
        const match = text.match(/PED_[A-Z0-9_]+/i);
        return match ? match[0].toUpperCase() : null;
    };

    if (error || visibleItems.length === 0) return null;

    return (
        <div className="space-y-2">
            {visibleItems.map((item) => (
                <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                    {(() => {
                        const pedidoId = getPedidoId(`${item.titulo} ${item.mensaje}`);
                        const href = pedidoId ? `/pedidos/${encodeURIComponent(pedidoId)}` : null;
                        const content = (
                            <>
                                <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Novedad</p>
                                <p className="font-semibold">{item.titulo}</p>
                                <p className="text-xs text-amber-800 mt-1">{item.mensaje}</p>
                            </>
                        );

                        return href ? (
                            <Link
                                href={href}
                                className="flex-1 rounded-lg outline-none transition hover:bg-amber-100/60 focus-visible:ring-2 focus-visible:ring-amber-300"
                                aria-label={`Ver pedido ${pedidoId}`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <div className="flex-1">{content}</div>
                        );
                    })()}
                    <button
                        type="button"
                        onClick={() => setDismissed((prev) => ({ ...prev, [item.id]: true }))}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                    >
                        Ocultar
                    </button>
                </div>
            ))}
        </div>
    );
}
