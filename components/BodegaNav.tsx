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
        <nav className="border-b border-gray-200 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Left: Logo + Title */}
                    <div className="flex items-center gap-4">
                        <Link href="/bodega" className="font-bold text-lg text-gray-900">
                            🏪 Panel Bodega
                        </Link>
                    </div>

                    {/* Center: Nav Links */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive(item.href)
                                        ? "bg-blue-100 text-blue-700"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {item.icon} {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:inline">
                            Rol: <span className="font-semibold text-gray-700">{role}</span>
                        </span>
                        <button
                            onClick={() => router.back()}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                            title="Volver atrás"
                        >
                            ← Atrás
                        </button>
                        <Link
                            href="/bodegas"
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                            title="Ir a seleccionar bodega"
                        >
                            🏠 Inicio
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden flex flex-wrap gap-2 mt-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-1 rounded text-xs font-medium transition ${isActive(item.href)
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                                }`}
                        >
                            {item.icon} {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
