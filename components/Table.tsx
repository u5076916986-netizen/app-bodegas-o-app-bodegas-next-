"use client";

import React from "react";

interface TableProps {
    columns: Array<{
        key: string;
        label: string;
        width?: string;
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
        <div className="overflow-x-auto rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-card)]">
            <table className="min-w-[640px] w-full text-xs sm:text-sm">
                <thead className="border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-left font-semibold text-[color:var(--text-muted)] ${col.width || ""}`}
                            >
                                {col.label}
                            </th>
                        ))}
                        {actions && (
                            <th className="px-4 py-3 text-left font-semibold text-[color:var(--text-muted)]">
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
                                className="px-4 py-8 text-center text-[color:var(--text-muted)]"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-bg)]"
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3 text-[color:var(--text-normal)]">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {actions.map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={() => action.onClick(row)}
                                                    className={`rounded px-2 py-1 text-xs font-semibold hover:opacity-80 ${action.className || "text-blue-600 hover:bg-blue-50"
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
