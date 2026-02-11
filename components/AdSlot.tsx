"use client";

import { useEffect, useState } from "react";

// Definimos el tipo localmente para evitar dependencias rotas si lib/anuncios no existe aún
type Anuncio = {
    id: string;
    bodegaId?: string | null;
    titulo: string;
    imagenUrl: string;
    ctaTexto?: string;
    ctaHref?: string;
    placements: ("home" | "catalogo" | "carrito" | "confirmar")[];
    activo: boolean;
    prioridad: number;
};

type Props = {
    placement: "home" | "catalogo" | "carrito" | "confirmar";
    bodegaId?: string;
    className?: string;
};

export default function AdSlot({ placement, bodegaId, className }: Props) {
    const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const fetchAds = async () => {
            const params = new URLSearchParams({ placement });
            if (bodegaId) params.append("bodegaId", bodegaId);

            try {
                // Fetch seguro que no rompe si la API no existe (404)
                const res = await fetch(`/api/anuncios?${params.toString()}`);
                if (!res.ok) return;

                const data = await res.json();
                if (data.ok && Array.isArray(data.anuncios) && data.anuncios.length > 0) {
                    setAnuncios(data.anuncios);
                    setVisible(true);

                    // Intentar trackear impresión sin bloquear
                    fetch("/api/anuncios/track", {
                        method: "POST",
                        body: JSON.stringify({ anuncioId: data.anuncios[0].id, event: "impression" }),
                    }).catch(() => { });
                }
            } catch (err) {
                // Ignorar errores de red o JSON para no romper la UI
            }
        };

        fetchAds();
    }, [placement, bodegaId]);

    if (!visible || anuncios.length === 0) return null;

    const ad = anuncios[0];

    const handleClick = () => {
        fetch("/api/anuncios/track", {
            method: "POST",
            body: JSON.stringify({ anuncioId: ad.id, event: "click" }),
        }).catch(() => { });
    };

    return (
        <div className={`my-4 w-full overflow-hidden rounded-lg shadow-sm transition hover:shadow-md ${className || ""}`}>
            {ad.ctaHref ? (
                <a href={ad.ctaHref} onClick={handleClick} className="block relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={ad.imagenUrl}
                        alt={ad.titulo}
                        className="h-auto w-full object-cover max-h-32"
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                        <p className="font-bold text-sm">{ad.titulo}</p>
                        {ad.ctaTexto && (
                            <span className="text-xs underline">{ad.ctaTexto} &rarr;</span>
                        )}
                    </div>
                </a>
            ) : (
                <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={ad.imagenUrl}
                        alt={ad.titulo}
                        className="h-auto w-full object-cover max-h-32"
                    />
                </div>
            )}
        </div>
    );
}