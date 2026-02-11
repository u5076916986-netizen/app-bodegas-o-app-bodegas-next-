"use client";

import { useEffect, useState } from "react";

export default function IncidenciaChip({ pedidoId }: { pedidoId: string }) {
    const [hasIncidencia, setHasIncidencia] = useState(false);

    useEffect(() => {
        if (!pedidoId) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/incidencias?pedidoId=${encodeURIComponent(pedidoId)}`, { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (data.ok && Array.isArray(data.data) && data.data.length > 0) {
                    setHasIncidencia(true);
                }
            } catch {
                // ignore
            }
        };
        load();
    }, [pedidoId]);

    if (!hasIncidencia) return null;

    return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Incidencia reportada
        </span>
    );
}
