"use client";

import React from "react";

/**
 * Componente Table - Tabla responsive optimizada para móvil
 * 
 * Características:
 * - Scroll horizontal en pantallas pequeñas
 * - Tamaños de fuente adaptables
 * - Espaciado táctil adecuado para móvil
 * - Contraste de colores mejorado
 */
interface TableProps {
    columns: Array<{
        key: string;
        label: string;
        width?: string;
        /** Si true, esta columna se oculta en móvil */
        hideOnMobile?: boolean;
        render?: (value: any, row: any) => React.ReactNode;
    }>;
    data: any[];
    actions?: Array<{
        label: string;
        onClick: (row: any) => void;
        className?: string;
    }>;
    emptyMessage?: string;
}

export default function Table({
    columns,
    data,
    actions,
    emptyMessage = "No hay datos",
}: TableProps) {
    return (
        // Contenedor con scroll horizontal para móvil
        <div className="overflow-x-auto rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-card)] -webkit-overflow-scrolling-touch">
            {/* Indicador de scroll en móvil */}
            <div className="sm:hidden text-xs text-slate-500 text-center py-1 bg-slate-50 border-b border-slate-200">
                ← Desliza para ver más →
            </div>
            <table className="min-w-[640px] w-full text-sm sm:text-sm">
                {/* Header de tabla con mejor contraste */}
                <thead className="border-b border-[color:var(--surface-border)] bg-slate-100">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-3 sm:px-4 py-3 sm:py-3 text-left font-semibold text-slate-700 whitespace-nowrap ${col.width || ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                            >
                                {col.label}
                            </th>
                        ))}
                        {actions && (
                            <th className="px-3 sm:px-4 py-3 sm:py-3 text-left font-semibold text-slate-700 sticky right-0 bg-slate-100">
                                Acciones
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (actions ? 1 : 0)}
                                className="px-4 py-8 text-center text-slate-600 text-sm"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-[color:var(--surface-border)] hover:bg-slate-50 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td 
                                        key={col.key} 
                                        className={`px-3 sm:px-4 py-3 sm:py-3 text-slate-800 ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                                    >
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-3 sm:px-4 py-3 sm:py-3 sticky right-0 bg-white">
                                        <div className="flex flex-wrap gap-1 sm:gap-2">
                                            {actions.map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={() => action.onClick(row)}
                                                    className={`rounded px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-semibold hover:opacity-80 transition-opacity min-h-[32px] ${action.className || "text-blue-700 hover:bg-blue-50 border border-blue-200"
                                                        }`}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
