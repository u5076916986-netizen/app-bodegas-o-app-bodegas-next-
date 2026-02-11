"use client";

import Link from "next/link";

interface BodegaDashboardClientProps {
    bodega: any;
    productosActivos: number;
    productosSinStock: number;
    pedidosHoy: number;
}

export default function BodegaClient({
    bodega,
    productosActivos,
    productosSinStock,
    pedidosHoy,
}: BodegaDashboardClientProps) {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Panel de Bodega (MVP)</h1>

            {bodega ? (
                <div className="mb-6 rounded-lg border p-4">
                    <h2 className="text-xl font-semibold">Resumen: {bodega.nombre}</h2>
                    <div className="mt-2 text-sm text-gray-700">
                        <div>Ciudad / Zona: {bodega.ciudad} / {bodega.zona}</div>
                        <div>Pedido mínimo: {bodega.min_pedido_cop ?? "—"} COP</div>
                        <div>Métodos de pago: {bodega.metodos_pago || "—"}</div>
                    </div>
                </div>
            ) : (
                <div className="mb-6 text-sm text-gray-600">No hay bodegas cargadas en CSV.</div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded">
                    <div className="text-sm text-gray-500">Productos activos</div>
                    <div className="text-2xl font-bold">{productosActivos}</div>
                </div>
                <div className="p-4 border rounded">
                    <div className="text-sm text-gray-500">Productos sin stock</div>
                    <div className="text-2xl font-bold">{productosSinStock}</div>
                </div>
                <div className="p-4 border rounded">
                    <div className="text-sm text-gray-500">Pedidos hoy</div>
                    <div className="text-2xl font-bold">{pedidosHoy}</div>
                </div>
            </div>

            <div className="flex gap-3">
                <Link href="/bodega/productos" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Gestionar Productos
                </Link>
                <Link href="/bodega/pedidos" className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                    Ver Pedidos
                </Link>
            </div>
        </div>
    );
}
