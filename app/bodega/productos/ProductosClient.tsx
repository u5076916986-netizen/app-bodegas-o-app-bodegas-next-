"use client";

import type { Producto } from "@/lib/csv";
import { useEffect, useMemo, useState } from "react";

export default function ProductosAdmin({ initialProducts }: { initialProducts: Producto[] }) {
    const [items, setItems] = useState<Producto[]>(() => initialProducts);
    const [savingId, setSavingId] = useState<string | null>(null);
    const key = "admin:productos:overrides";

    useEffect(() => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const map = JSON.parse(raw) as Record<string, Partial<Producto>>;
            setItems((prev) => prev.map((p) => ({ ...p, ...(map[p.producto_id] || {}) })));
        } catch (e) {
            console.error("load overrides", e);
        }
    }, []);

    const handleField = (id: string, field: "precio_cop" | "stock" | "activo", value: any) => {
        setItems((prev) => prev.map((p) => (p.producto_id === id ? { ...p, [field]: value } : p)));
    };

    const saveOne = (id: string) => {
        const item = items.find((p) => p.producto_id === id);
        if (!item) return;
        // validations
        if ((item.precio_cop ?? 0) <= 0) return alert("Precio debe ser > 0");
        if ((item.stock ?? 0) < 0) return alert("Stock debe ser >= 0");

        setSavingId(id);
        try {
            const raw = localStorage.getItem(key);
            const map = raw ? JSON.parse(raw) : {};
            map[id] = { precio_cop: item.precio_cop, stock: item.stock, activo: item.activo };
            localStorage.setItem(key, JSON.stringify(map));
            setTimeout(() => setSavingId(null), 300);
        } catch (e) {
            console.error("save", e);
            setSavingId(null);
        }
    };

    const activeCount = useMemo(() => items.filter((p) => p.activo).length, [items]);

    return (
        <div>
            <div className="mb-4 text-sm text-gray-600">Productos listados: {items.length} — Activos: {activeCount}</div>
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="p-2 border">Nombre</th>
                            <th className="p-2 border">Categoría</th>
                            <th className="p-2 border">Precio (COP)</th>
                            <th className="p-2 border">Stock</th>
                            <th className="p-2 border">Activo</th>
                            <th className="p-2 border">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p.producto_id} className="odd:bg-white even:bg-gray-50">
                                <td className="p-2 border">{p.nombre}</td>
                                <td className="p-2 border">{p.categoria}</td>
                                <td className="p-2 border">
                                    <input
                                        type="number"
                                        className="w-28 p-1 border rounded"
                                        value={p.precio_cop ?? ""}
                                        onChange={(e) => handleField(p.producto_id, "precio_cop", Number(e.target.value))}
                                        min={1}
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="number"
                                        className="w-20 p-1 border rounded"
                                        value={p.stock ?? 0}
                                        onChange={(e) => handleField(p.producto_id, "stock", Number(e.target.value))}
                                        min={0}
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="checkbox"
                                        checked={!!p.activo}
                                        onChange={(e) => handleField(p.producto_id, "activo", e.target.checked)}
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        onClick={() => saveOne(p.producto_id)}
                                        className="px-3 py-1 bg-sky-600 text-white rounded"
                                        disabled={savingId === p.producto_id}
                                    >
                                        {savingId === p.producto_id ? "Guardando..." : "Guardar"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
