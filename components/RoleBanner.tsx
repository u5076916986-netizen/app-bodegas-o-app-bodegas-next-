'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function RoleBanner() {
    const pathname = usePathname();

    // Determinar el rol según la ruta
    const getRoleFromPath = (path: string): { name: string; color: string; bg: string } | null => {
        if (path.startsWith('/bodega/') && !path.startsWith('/bodegas')) {
            return { name: 'Bodega', color: 'text-green-700', bg: 'bg-green-100 border-green-300' };
        }
        if (path.startsWith('/bodegas') || path.startsWith('/tendero')) {
            return { name: 'Tendero', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' };
        }
        if (path.startsWith('/repartidor')) {
            return { name: 'Repartidor', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' };
        }
        if (path.startsWith('/admin')) {
            return { name: 'Administrador', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' };
        }
        return null;
    };

    const role = getRoleFromPath(pathname);

    // No mostrar en la página de inicio
    if (pathname === '/inicio' || pathname === '/') {
        return null;
    }

    // Si no hay rol detectado, no mostrar
    if (!role) {
        return null;
    }

    return (
        <div className="w-full bg-slate-50 border-b border-slate-200 py-2 px-4">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
                {/* Chip de modo */}
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${role.bg} ${role.color}`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        Modo: {role.name}
                    </span>
                </div>

                {/* Botón cambiar modo */}
                <Link
                    href="/inicio"
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                >
                    Cambiar modo →
                </Link>
            </div>
        </div>
    );
}
