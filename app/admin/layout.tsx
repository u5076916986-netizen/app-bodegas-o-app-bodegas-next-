"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/usuarios", label: "Usuarios", icon: "👥" },
    { href: "/admin/bodegas", label: "Bodegas", icon: "🏪" },
    { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleModeSwitch = () => {
        localStorage.removeItem("modo");
        router.push("/");
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
                {/* Top Navigation Bar */}
                <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo and Mode Badge */}
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-slate-900">APP Bodegas</span>
                                </Link>
                                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-full shadow-sm">
                                    Modo: Administrador
                                </span>
                            </div>

                            {/* Navigation Links */}
                            <nav className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive
                                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }
                      `}
                                        >
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Mode Switch Button */}
                            <button
                                onClick={handleModeSwitch}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                <span>🔄</span>
                                <span className="hidden sm:inline">Cambiar modo</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="md:hidden border-t border-slate-200 px-4 py-2 flex gap-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200
                    ${isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-50"
                                        }
                  `}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-slate-200 mt-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <p className="text-center text-sm text-slate-500">
                            © 2026 APP Bodegas - Panel de Administración
                        </p>
                    </div>
                </footer>
            </div>
        </AdminGuard>
    );
}
