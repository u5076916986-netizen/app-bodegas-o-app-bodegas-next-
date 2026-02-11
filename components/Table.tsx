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
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full">
                <thead className="border-b bg-slate-50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-left text-xs font-semibold text-slate-700 ${col.width || ""}`}
                            >
                                {col.label}
                            </th>
                        ))}
                        {actions && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-slate-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3 text-sm text-slate-900">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex gap-2">
                                            {actions.map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={() => action.onClick(row)}
                                                    className={`text-xs font-semibold px-2 py-1 rounded hover:opacity-80 ${action.className || "text-blue-600 hover:bg-blue-50"
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
