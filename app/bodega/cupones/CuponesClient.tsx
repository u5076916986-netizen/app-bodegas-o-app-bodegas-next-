"use client";

import { useState } from "react";
import type { Cupon } from "@/lib/cupones";
import { randomUUID } from "crypto";

export default function CuponesClient({
    initialCupones,
}: {
    initialCupones: Cupon[];
}) {
    const [cupones, setCupones] = useState<Cupon[]>(initialCupones);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<{
        code: string;
        type: "fixed" | "percent";
        value: number;
        minSubtotal: number;
        startDate: string;
        endDate: string;
    }>({
        code: "",
        type: "fixed",
        value: 0,
        minSubtotal: 0,
        startDate: "",
        endDate: "",
    });

    const handleCreateCupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/cupones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error HTTP ${res.status}`);
            }

            const data = await res.json() as { ok: boolean; cupon?: Cupon };
            if (data.ok && data.cupon) {
                setCupones([...cupones, data.cupon]);
                setFormData({
                    code: "",
                    type: "fixed",
                    value: 0,
                    minSubtotal: 0,
                    startDate: "",
                    endDate: "",
                });
                setShowForm(false);
            } else {
                throw new Error("No se pudo crear el cupón");
            }
        } catch (err: any) {
            setError(err.message || "Error al crear cupón");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (cupon: Cupon) => {
        try {
            const res = await fetch(`/api/cupones/${cupon.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !cupon.active }),
            });

            if (!res.ok) throw new Error("Error al actualizar cupón");

            const data = await res.json() as { ok: boolean; cupon?: Cupon };
            if (data.ok && data.cupon) {
                setCupones(cupones.map((c) => (c.id === cupon.id ? data.cupon! : c)));
            }
        } catch (err: any) {
            setError(err.message || "Error al actualizar cupón");
        }
    };

    const handleDeleteCupon = async (cupon: Cupon) => {
        if (!confirm(`¿Eliminar cupón ${cupon.code}?`)) return;

        try {
            const res = await fetch(`/api/cupones/${cupon.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Error al eliminar cupón");

            setCupones(cupones.filter((c) => c.id !== cupon.id));
        } catch (err: any) {
            setError(err.message || "Error al eliminar cupón");
        }
    };

    return (
        <div>
            {error && (
                <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm">
                    Error: {error}
                </div>
            )}

            <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    Total de cupones: {cupones.length}
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {showForm ? "Cancelar" : "Crear Cupón"}
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleCreateCupon}
                    className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-3"
                >
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Código
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) =>
                                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                                }
                                placeholder="PROMO2024"
                                className="w-full px-3 py-2 border rounded text-sm outline-none focus:border-blue-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tipo
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        type: (val === "percent" ? "percent" : "fixed") as "fixed" | "percent",
                                    });
                                }}
                                className="w-full px-3 py-2 border rounded text-sm outline-none focus:border-blue-400"
                            >
                                <option value="fixed">Monto fijo (COP)</option>
                                <option value="percent">Porcentaje (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Valor
                            </label>
                            <input
                                type="number"
                                value={formData.value}
                                onChange={(e) =>
                                    setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                                }
                                placeholder="1000"
                                className="w-full px-3 py-2 border rounded text-sm outline-none focus:border-blue-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Mínimo de compra (opcional)
                            </label>
                            <input
                                type="number"
                                value={formData.minSubtotal}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        minSubtotal: parseFloat(e.target.value) || 0,
                                    })
                                }
                                placeholder="50000"
                                className="w-full px-3 py-2 border rounded text-sm outline-none focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Fecha inicio (opcional)
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded text-sm outline-none focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Fecha fin (opcional)
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded text-sm outline-none focus:border-blue-400"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !formData.code || !formData.value}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Guardando..." : "Guardar Cupón"}
                    </button>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left bg-gray-100">
                            <th className="p-3 border">Código</th>
                            <th className="p-3 border">Tipo</th>
                            <th className="p-3 border">Valor</th>
                            <th className="p-3 border">Mínimo</th>
                            <th className="p-3 border">Vigencia</th>
                            <th className="p-3 border">Estado</th>
                            <th className="p-3 border">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cupones.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-500">
                                    No hay cupones. Crea uno para empezar.
                                </td>
                            </tr>
                        ) : (
                            cupones.map((cupon) => (
                                <tr key={cupon.id} className="odd:bg-white even:bg-gray-50">
                                    <td className="p-3 border text-sm font-semibold">
                                        {cupon.code}
                                    </td>
                                    <td className="p-3 border text-sm">
                                        {cupon.type === "percent" ? "%" : "COP"}
                                    </td>
                                    <td className="p-3 border text-sm">
                                        {cupon.type === "percent"
                                            ? `${cupon.value}%`
                                            : `$${cupon.value.toLocaleString("es-CO")}`}
                                    </td>
                                    <td className="p-3 border text-sm">
                                        {cupon.minSubtotal
                                            ? `$${cupon.minSubtotal.toLocaleString("es-CO")}`
                                            : "—"}
                                    </td>
                                    <td className="p-3 border text-xs">
                                        {cupon.startDate || cupon.endDate ? (
                                            <div>
                                                {cupon.startDate && (
                                                    <div>
                                                        Desde:{" "}
                                                        {new Date(cupon.startDate).toLocaleDateString(
                                                            "es-CO"
                                                        )}
                                                    </div>
                                                )}
                                                {cupon.endDate && (
                                                    <div>
                                                        Hasta:{" "}
                                                        {new Date(cupon.endDate).toLocaleDateString(
                                                            "es-CO"
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="p-3 border">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${
                                                cupon.active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {cupon.active ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td className="p-3 border space-x-2">
                                        <button
                                            onClick={() => handleToggleActive(cupon)}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            {cupon.active ? "Desactivar" : "Activar"}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCupon(cupon)}
                                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
