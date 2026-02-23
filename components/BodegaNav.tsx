"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "@/components/RoleProvider";

export default function BodegaNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { role } = useRole();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { label: "Panel", href: "/bodega/panel", icon: "📊" },
        { label: "Productos", href: "/bodega/productos", icon: "📦" },
        { label: "Inventario", href: "/bodega/inventario", icon: "📋" },
        { label: "Promociones", href: "/bodega/promociones", icon: "🎯" },
        { label: "Pedidos", href: "/bodega/pedidos", icon: "📄" },
        { label: "Clientes", href: "/bodega/clientes", icon: "👥" },
        { label: "Logística", href: "/bodega/logistica", icon: "🚚" },
        { label: "Config", href: "/bodega/configuracion", icon: "⚙️" },
        { label: "Usuarios", href: "/bodega/usuarios", icon: "👤" },
    ];

    return (
        // Navegación de bodega - optimizada para móvil
        <nav className="border-b border-gray-200 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 lg:px-8">
                <div className="flex items-center justify-between gap-2">
                    {/* Logo + Title - más compacto en móvil */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/bodega" className="font-bold text-base sm:text-lg text-gray-900">
                            🏪 <span className="hidden xs:inline">Panel</span> Bodega
                        </Link>
                    </div>

                    {/* Nav Links - visible solo en desktop */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive(item.href)
                                        ? "bg-blue-100 text-blue-800 font-semibold"
                                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                            >
                                {item.icon} {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Acciones - más compactas en móvil */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs text-gray-600 hidden sm:inline">
                            Rol: <span className="font-semibold text-gray-800">{role}</span>
                        </span>
                        <button
                            onClick={() => router.back()}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md min-h-[36px] flex items-center"
                            title="Volver atrás"
                        >
                            ← <span className="hidden sm:inline ml-1">Atrás</span>
                        </button>
                        <Link
                            href="/bodegas"
                            className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md min-h-[36px] flex items-center"
                            title="Ir a seleccionar bodega"
                        >
                            🏠 <span className="hidden sm:inline ml-1">Inicio</span>
                        </Link>
                    </div>
                </div>

                {/* Menú móvil - scroll horizontal con mejor diseño */}
                <div className="lg:hidden flex overflow-x-auto gap-1.5 mt-2 pb-1 -mx-1 px-1 scrollbar-hide">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition min-h-[40px] flex items-center ${isActive(item.href)
                                    ? "bg-blue-100 text-blue-800 font-semibold border border-blue-200"
                                    : "text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                }`}
                        >
                            <span className="mr-1">{item.icon}</span>
                            <span className="whitespace-nowrap">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
