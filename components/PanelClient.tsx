'use client';

import Link from 'next/link';

interface PanelClientProps {
    bodegaId: string;
    sinStock: number;
    entregasPendientes: number;
}

export default function PanelClient({
    bodegaId,
    sinStock,
    entregasPendientes,
}: PanelClientProps) {
    const kpis = [
        { label: 'Pedidos hoy', value: '5', color: 'bg-blue-500' },
        {
            label: 'Entregas pendientes',
            value: entregasPendientes.toString(),
            color: 'bg-yellow-500',
        },
        {
            label: 'Productos sin stock',
            value: sinStock.toString(),
            color: 'bg-red-500',
        },
        { label: 'Promos activas', value: '3', color: 'bg-green-500' },
    ];

    const alerts = [
        { type: 'warning', message: 'Hay 2 productos con stock bajo' },
        { type: 'error', message: 'Hay 1 producto sin stock' },
        { type: 'info', message: '3 entregas pendientes hoy' },
    ];

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Panel de Control</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className={`${kpi.color} text-white p-6 rounded-lg shadow`}
                    >
                        <p className="text-sm opacity-90">{kpi.label}</p>
                        <p className="text-3xl font-bold">{kpi.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold">Alertas</h2>
                {alerts.map((alert, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded ${alert.type === 'warning'
                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                : alert.type === 'error'
                                    ? 'bg-red-50 border border-red-200 text-red-800'
                                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                            }`}
                    >
                        {alert.message}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href={`/bodega/${bodegaId}/inventario`}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:shadow-lg transition"
                >
                    <h3 className="text-lg font-bold mb-2">📦 Inventario</h3>
                    <p className="text-sm opacity-90">Gestionar productos y stock</p>
                </Link>
                <Link
                    href={`/bodega/${bodegaId}/pedidos`}
                    className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg hover:shadow-lg transition"
                >
                    <h3 className="text-lg font-bold mb-2">🛒 Pedidos</h3>
                    <p className="text-sm opacity-90">Ver y gestionar pedidos</p>
                </Link>
                <Link
                    href={`/bodega/${bodegaId}/logistica`}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:shadow-lg transition"
                >
                    <h3 className="text-lg font-bold mb-2">🚚 Logística</h3>
                    <p className="text-sm opacity-90">Entregas y repartidores</p>
                </Link>
                <Link
                    href={`/bodega/${bodegaId}/clientes`}
                    className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg hover:shadow-lg transition"
                >
                    <h3 className="text-lg font-bold mb-2">👥 Clientes</h3>
                    <p className="text-sm opacity-90">Gestionar clientes</p>
                </Link>
            </div>
        </div>
    );
}
