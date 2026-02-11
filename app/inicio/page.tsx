import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Inicio | APP Bodegas",
    description: "Selecciona tu rol para continuar",
};

const roles = [
    {
        id: "tendero",
        title: "Tendero",
        description: "Realiza pedidos a bodegas",
        icon: "🛒",
        href: "/bodegas",
        color: "from-blue-500 to-blue-600",
    },
    {
        id: "bodega",
        title: "Bodega",
        description: "Gestiona inventario y pedidos",
        icon: "📦",
        href: "/bodega/BOD_002/panel",
        color: "from-green-500 to-green-600",
    },
    {
        id: "repartidor",
        title: "Repartidor",
        description: "Gestiona entregas y rutas",
        icon: "🚚",
        href: "/repartidor/entregas",
        color: "from-orange-500 to-orange-600",
    },
    {
        id: "admin",
        title: "Administrador",
        description: "Panel de administración",
        icon: "⚙️",
        href: "/admin",
        color: "from-purple-500 to-purple-600",
    },
];

export default function InicioPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="mx-auto max-w-6xl px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">
                        APP Bodegas
                    </h1>
                    <p className="text-lg text-slate-600">
                        Selecciona tu rol para continuar
                    </p>
                </div>

                {/* Tarjetas de roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {roles.map((role) => (
                        <Link
                            key={role.id}
                            href={role.href}
                            className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            {/* Gradiente de fondo */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                            {/* Contenido */}
                            <div className="relative p-8">
                                {/* Icono */}
                                <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-100 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl">{role.icon}</span>
                                </div>

                                {/* Título */}
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    {role.title}
                                </h2>

                                {/* Descripción */}
                                <p className="text-slate-600 mb-4">
                                    {role.description}
                                </p>

                                {/* Flecha */}
                                <div className="flex items-center text-slate-400 group-hover:text-slate-600 transition-colors">
                                    <span className="text-sm font-semibold mr-2">Acceder</span>
                                    <svg
                                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                    <p className="text-sm text-slate-500">
                        Sistema de gestión de pedidos para bodegas
                    </p>
                </div>
            </div>
        </main>
    );
}
