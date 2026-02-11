"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";

interface Cliente {
    clienteId: string;
    bodegaId: string;
    nombre: string;
    telefono?: string;
    zona?: string;
    totalCompras: number;
    gastTotal: number;
    tipo?: "nuevo" | "frecuente";
    estado?: "nuevo" | "frecuente";
    ultimaCompra?: string;
    creditoDisponible?: number;
}

type ClienteNormalizado = Cliente & { tipo: "nuevo" | "frecuente" };

export default function ClientesClient({ bodegaId }: { bodegaId: string }) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bodegaId) return;
        const fetchClientes = async () => {
            try {
                setError(null);
                const response = await fetch(`/api/bodega/${bodegaId}/clientes`, {
                    cache: "no-store",
                });
                if (!response.ok) {
                    setError("No se pudieron cargar los clientes");
                    return;
                }
                const data = await response.json();
                setClientes(data.data || []);
            } catch (err) {
                setError("Error cargando clientes");
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, [bodegaId]);

    const formatDate = (value?: string) => {
        if (!value) return "N/D";
        return new Date(value).toLocaleDateString("es-CO");
    };

    const normalized = useMemo<ClienteNormalizado[]>(
        () =>
            clientes.map((cliente) => {
                const tipo =
                    cliente.tipo ??
                    (cliente.estado === "frecuente" ? "frecuente" : "nuevo");
                return { ...cliente, tipo } as ClienteNormalizado;
            }),
        [clientes]
    );

    const totalClientes = normalized.length;
    const clientesFrecuentes = normalized.filter((c) => c.tipo === "frecuente");
    const clientesNuevos = normalized.filter((c) => c.tipo === "nuevo");
    const topClientes = [...normalized]
        .sort((a, b) => (b.gastTotal ?? 0) - (a.gastTotal ?? 0))
        .slice(0, 3);

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    if (loading) {
        return <div className="p-4">Cargando clientes...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Clientes</h1>
            </div>

            {error ? (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Frecuentes</p>
                    <p className="text-2xl font-bold text-gray-900">{clientesFrecuentes.length}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Nuevos</p>
                    <p className="text-2xl font-bold text-gray-900">{clientesNuevos.length}</p>
                </div>
            </div>

            {topClientes.length > 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-gray-700">Top clientes</h2>
                    <div className="mt-3 grid gap-2">
                        {topClientes.map((cliente) => (
                            <div
                                key={cliente.clienteId}
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                                    <p className="text-xs text-gray-500">
                                        Ultima compra: {formatDate(cliente.ultimaCompra)}
                                    </p>
                                </div>
                                <p className="font-semibold text-gray-900">
                                    {formatCurrency(cliente.gastTotal)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Telefono</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Zona</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Compras</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Gasto total</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Ultima compra</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {normalized.map((cliente) => (
                            <tr key={cliente.clienteId} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium">{cliente.nombre}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {cliente.telefono || "N/D"}
                                </td>
                                <td className="px-6 py-4 text-sm">{cliente.zona || "N/D"}</td>
                                <td className="px-6 py-4 text-sm text-right">{cliente.totalCompras}</td>
                                <td className="px-6 py-4 text-sm text-right font-semibold">
                                    {formatCurrency(cliente.gastTotal)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-600">
                                    {formatDate(cliente.ultimaCompra)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cliente.tipo === "frecuente"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-blue-100 text-blue-800"
                                            }`}
                                    >
                                        {cliente.tipo === "frecuente" ? "⭐ Frecuente" : "🆕 Nuevo"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
