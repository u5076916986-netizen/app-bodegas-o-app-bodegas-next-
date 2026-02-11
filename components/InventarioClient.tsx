"use client";

import { useEffect, useMemo, useState } from "react";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";

interface Inventario {
    productoId: string;
    bodegaId: string;
    nombre: string;
    categoria: string;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    precio: number;
    precioMayor: number;
}

export default function InventarioClient({ bodegaId }: { bodegaId: string }) {
    const [inventario, setInventario] = useState<Inventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState<Inventario | null>(null);
    const [delta, setDelta] = useState<number>(0);
    const [motivo, setMotivo] = useState<string>("reabastecimiento");
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (!bodegaId) return;
        fetchInventario();
    }, [bodegaId]);

    const fetchInventario = async () => {
        try {
            const response = await fetch(
                `/api/bodega/${bodegaId}/inventario`,
                { cache: "no-store" }
            );
            if (response.ok) {
                const data = await response.json();
                setInventario(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching inventario:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAjustar = (producto: Inventario) => {
        setSelectedProducto(producto);
        setDelta(0);
        setMotivo("reabastecimiento");
        setModalOpen(true);
    };

    const handleSave = () => {
        if (selectedProducto && delta !== 0) {
            console.log('Ajustando stock:', {
                producto: selectedProducto.nombre,
                delta,
                motivo,
                nuevoStock: selectedProducto.stockActual + delta,
            });
            setModalOpen(false);
        }
    };

    const getStatusBadge = (stock: number, minimo: number) => {
        if (stock === 0) return { label: "Sin stock", color: "bg-red-100 text-red-800" };
        if (stock < minimo) return { label: "Bajo", color: "bg-yellow-100 text-yellow-800" };
        return { label: "OK", color: "bg-green-100 text-green-800" };
    };

    const { fuse } = useMemo(() => {
        const enriched = inventario.map((item) => ({
            ...item,
            sku: item.productoId,
            tags: [],
            unidad: "",
            presentacion: "",
        }));
        return buildFuseIndex(enriched);
    }, [inventario]);

    const filteredInventario = useMemo(() => {
        if (!query.trim()) return inventario;
        const expanded = expandQuery(query);
        return smartSearch(fuse, expanded, 300) as Inventario[];
    }, [inventario, query, fuse]);

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    if (loading) return <div className="p-4">Cargando inventario...</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Inventario</h1>

            <div className="bg-white rounded-lg shadow p-4">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por producto, categoría o ID"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Producto</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Categoría</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Stock Actual</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Mín/Máx</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Estado</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventario.map((item) => {
                            const status = getStatusBadge(item.stockActual, item.stockMinimo);
                            return (
                                <tr key={item.productoId} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium">{item.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.categoria}</td>
                                    <td className="px-6 py-4 text-sm text-right font-semibold">{item.stockActual}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                                        {item.stockMinimo} / {item.stockMaximo}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleAjustar(item)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                        >
                                            Ajustar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {modalOpen && selectedProducto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Ajustar Stock: {selectedProducto.nombre}</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="stock-actual" className="block text-sm font-semibold mb-2">Stock Actual</label>
                                <input
                                    id="stock-actual"
                                    type="number"
                                    disabled
                                    value={selectedProducto.stockActual}
                                    className="w-full px-3 py-2 border rounded bg-gray-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="stock-cambio" className="block text-sm font-semibold mb-2">Cambio</label>
                                <input
                                    id="stock-cambio"
                                    type="number"
                                    value={delta}
                                    onChange={(e) => setDelta(Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="+10 o -5"
                                />
                            </div>
                            <div>
                                <label htmlFor="stock-motivo" className="block text-sm font-semibold mb-2">Motivo</label>
                                <select
                                    id="stock-motivo"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="reabastecimiento">Reabastecimiento</option>
                                    <option value="venta">Venta</option>
                                    <option value="merma">Merma</option>
                                    <option value="devolucion">Devolución</option>
                                </select>
                            </div>
                            <p className="text-sm">
                                Nuevo stock: <strong>{selectedProducto.stockActual + delta}</strong>
                            </p>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
