"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Bodega } from "@/lib/csv";

type BodegasClientProps = {
    bodegas: Bodega[];
};

export default function BodegasClient({ bodegas }: BodegasClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "min_low">("all");

    const filteredBodegas = useMemo(() => {
        let result = bodegas.filter((b) =>
            b.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filter === "min_low") {
            result = [...result].sort(
                (a, b) => (a.min_pedido_cop || 0) - (b.min_pedido_cop || 0)
            );
        }

        return result;
    }, [bodegas, searchTerm, filter]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1.2 Barra superior sticky */}
            <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 py-3">
                    <h1 className="text-xl font-bold text-gray-900 mb-3">Bodegas</h1>

                    <div className="flex flex-col gap-3">
                        {/* Input Búsqueda */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar bodega..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg
                                className="absolute left-3 top-2.5 text-gray-400 w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>

                        {/* Chips Filtro */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === "all"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilter("min_low")}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === "min_low"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                Mínimo bajo
                            </button>
                            {/* Mock chips */}
                            <button className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-gray-200">
                                Populares
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1.1 Grid de Cards */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                {filteredBodegas.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No encontramos bodegas con ese nombre.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBodegas.map((bodega) => (
                            <Link
                                key={bodega.bodega_id}
                                href={`/bodegas/${bodega.bodega_id}`}
                                className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow active:scale-[0.99] transform duration-100"
                            >
                                <div className="p-4 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {/* Logo Placeholder */}
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold overflow-hidden border border-gray-200">
                                                {bodega.logo_url ? (
                                                    <img src={bodega.logo_url} alt={bodega.nombre} className="w-full h-full object-cover" />
                                                ) : (
                                                    bodega.nombre.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight">{bodega.nombre}</h3>
                                                <p className="text-sm text-gray-500">{bodega.zona || bodega.ciudad}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                            Min: <span className="font-semibold text-gray-700">${bodega.min_pedido_cop?.toLocaleString("es-CO") ?? "0"}</span>
                                        </div>
                                        <span className="text-blue-600 text-sm font-bold">Ver catálogo →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}