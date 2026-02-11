"use client";

import { useEffect, useMemo, useState } from "react";

export type FotoProducto = {
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
    unidad: string;
    sku?: string;
    confidence?: number;
};

type ValidationResult = {
    errors: string[];
};

interface ProductImportReviewProps {
    initialProducts: FotoProducto[];
    loading?: boolean;
    onSaveAll: (products: FotoProducto[]) => void;
    onSaveValid: (products: FotoProducto[]) => void;
    onDiscard: () => void;
}

const validateProducto = (producto: FotoProducto): ValidationResult => {
    const errors: string[] = [];
    if (!producto.nombre || producto.nombre.trim().length < 3) {
        errors.push("nombre corto");
    }
    if (!producto.categoria || producto.categoria.trim().length === 0) {
        errors.push("categoría faltante");
    }
    if (!Number.isFinite(producto.precio) || producto.precio <= 0) {
        errors.push("precio faltante");
    }
    if (!Number.isFinite(producto.stock) || producto.stock < 0) {
        errors.push("stock inválido");
    }
    if (!producto.unidad || producto.unidad.trim().length === 0) {
        errors.push("unidad faltante");
    }
    return { errors };
};

export default function ProductImportReview({
    initialProducts,
    loading = false,
    onSaveAll,
    onSaveValid,
    onDiscard,
}: ProductImportReviewProps) {
    const [rows, setRows] = useState<FotoProducto[]>(initialProducts);
    const [banner, setBanner] = useState<string | null>(null);

    useEffect(() => {
        setRows(initialProducts);
        setBanner(null);
    }, [initialProducts]);

    const validations = useMemo(() => rows.map(validateProducto), [rows]);

    const invalidCount = validations.filter((v) => v.errors.length > 0).length;
    const validRows = rows.filter((_, index) => validations[index]?.errors.length === 0);

    const handleSaveAll = () => {
        if (invalidCount > 0) {
            setBanner("Corrige los errores antes de guardar todo.");
            return;
        }
        setBanner(null);
        onSaveAll(rows);
    };

    const handleSaveValid = () => {
        if (validRows.length === 0) {
            setBanner("No hay filas válidas para guardar.");
            return;
        }
        setBanner(null);
        onSaveValid(validRows);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Revisión de productos</h3>
                    <p className="text-xs text-slate-500">Edita antes de guardar el catálogo.</p>
                    {invalidCount > 0 ? (
                        <p className="text-xs text-amber-700 mt-1">
                            {invalidCount} fila(s) con errores.
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={loading || rows.length === 0}
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                    >
                        {loading ? "Guardando..." : "Guardar todo"}
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveValid}
                        disabled={loading || rows.length === 0}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                    >
                        Guardar válidos
                    </button>
                    <button
                        type="button"
                        onClick={onDiscard}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                        Descartar
                    </button>
                </div>
            </div>

            {banner ? (
                <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {banner}
                </div>
            ) : null}

            <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-900">Nombre</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-900">Categoría</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-900">Precio</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-900">Stock</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-900">Unidad</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-900">SKU</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-900">Confianza</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-900">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((prod, idx) => {
                            const validation = validations[idx];
                            const hasErrors = validation.errors.length > 0;
                            const confidenceValue = typeof prod.confidence === "number" ? prod.confidence : null;
                            const isLowConfidence = confidenceValue !== null && confidenceValue < 0.6;
                            return (
                                <tr key={`${prod.nombre}-${idx}`} className="border-b border-slate-200">
                                    <td className={`px-3 py-2 ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        <input
                                            value={prod.nombre}
                                            onChange={(e) => {
                                                const next = [...rows];
                                                next[idx] = { ...next[idx], nombre: e.target.value };
                                                setRows(next);
                                            }}
                                            placeholder="Nombre"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                                        />
                                    </td>
                                    <td className={`px-3 py-2 ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        <input
                                            value={prod.categoria}
                                            onChange={(e) => {
                                                const next = [...rows];
                                                next[idx] = { ...next[idx], categoria: e.target.value };
                                                setRows(next);
                                            }}
                                            placeholder="Categoría"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                                        />
                                    </td>
                                    <td className={`px-3 py-2 text-right ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        <input
                                            type="number"
                                            value={Number.isFinite(prod.precio) ? prod.precio : 0}
                                            onChange={(e) => {
                                                const next = [...rows];
                                                next[idx] = { ...next[idx], precio: Number(e.target.value) };
                                                setRows(next);
                                            }}
                                            placeholder="Precio"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-right"
                                        />
                                    </td>
                                    <td className={`px-3 py-2 text-right ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        <input
                                            type="number"
                                            value={Number.isFinite(prod.stock) ? prod.stock : 0}
                                            onChange={(e) => {
                                                const next = [...rows];
                                                next[idx] = { ...next[idx], stock: Number(e.target.value) };
                                                setRows(next);
                                            }}
                                            placeholder="Stock"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-right"
                                        />
                                    </td>
                                    <td className={`px-3 py-2 ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        <input
                                            value={prod.unidad}
                                            onChange={(e) => {
                                                const next = [...rows];
                                                next[idx] = { ...next[idx], unidad: e.target.value };
                                                setRows(next);
                                            }}
                                            placeholder="Unidad"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                                        />
                                    </td>
                                    <td className={`px-3 py-2 ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        <input
                                            value={prod.sku ?? ""}
                                            onChange={(e) => {
                                                const next = [...rows];
                                                next[idx] = { ...next[idx], sku: e.target.value };
                                                setRows(next);
                                            }}
                                            placeholder="SKU"
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                                        />
                                    </td>
                                    <td className={`px-3 py-2 ${isLowConfidence ? "bg-amber-50" : ""}`}>
                                        {confidenceValue !== null ? (
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${isLowConfidence ? "bg-amber-200 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                                                {Math.round(confidenceValue * 100)}%
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        {hasErrors ? (
                                            <div className="text-[10px] text-red-600">
                                                {validation.errors.join(", ")}
                                            </div>
                                        ) : (
                                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                                Válido
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
