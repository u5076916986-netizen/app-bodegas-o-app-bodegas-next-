'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfileBanner() {
    const [tendero, setTendero] = useState<any>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Cargar tendero del localStorage
        const stored = localStorage.getItem('tendero');
        if (stored) {
            setTendero(JSON.parse(stored));
        }

        // Verificar si el banner fue cerrado
        const wasDismissed = localStorage.getItem('profileBannerDismissed');
        if (wasDismissed === 'true') {
            setDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('profileBannerDismissed', 'true');
    };

    // No mostrar si:
    // - No hay tendero
    // - Es invitado
    // - Ya tiene foto de tienda
    // - Fue cerrado
    if (!tendero || tendero.isGuest || tendero.fotoTienda || dismissed) {
        return null;
    }

    return (
        <div className="mb-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                {/* Icono */}
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📸</span>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-900 mb-0.5">
                        Completa tu perfil (opcional)
                    </p>
                    <p className="text-xs text-slate-600">
                        Sube una foto de tu tienda y personaliza tu cuenta
                    </p>
                </div>

                {/* Botones */}
                <div className="flex-shrink-0 flex gap-2">
                    <Link
                        href="/tendero/perfil"
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-md hover:bg-purple-700 transition whitespace-nowrap"
                    >
                        Ir al perfil
                    </Link>
                    <button
                        onClick={handleDismiss}
                        className="px-3 py-2 text-slate-500 hover:text-slate-700 transition"
                        aria-label="Cerrar banner"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
