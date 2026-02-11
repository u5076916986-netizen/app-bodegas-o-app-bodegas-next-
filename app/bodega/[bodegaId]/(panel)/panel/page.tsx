import { readFile } from 'fs/promises';
import { join } from 'path';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';

interface Inventario {
    productoId: string;
    nombre: string;
    stockActual: number;
    stockMinimo: number;
    bodegaId?: string;
}

interface Entrega {
    entregaId: string;
    bodegaId: string;
    estado: 'pendiente' | 'listo' | 'en_camino' | 'entregado';
}

interface Cliente {
    clienteId: string;
    bodegaId: string;
    nombre: string;
    telefono?: string;
    zona?: string;
    totalCompras: number;
    gastTotal: number;
    ultimaCompra?: string;
    estado?: 'nuevo' | 'frecuente';
}

type Params = { bodegaId: string };

export default async function PanelPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { bodegaId } = await params;

    let inventarioList: Inventario[] = [];
    let entregasList: Entrega[] = [];
    let productosSinStock = 0;
    let productosStock10 = 0;
    let entregasPendientes = 0;
    let pedidosHoy = 0;
    let promosActivas = 2;
    let clientesList: Cliente[] = [];
    let totalClientes = 0;
    let clientesFrecuentes = 0;
    let clientesNuevos = 0;
    let topClientes: Cliente[] = [];

    try {
        const basePath = process.cwd();

        // Leer inventario
        try {
            const inventarioData = await readFile(
                join(basePath, 'data', 'inventario.json'),
                'utf-8'
            );
            inventarioList = JSON.parse(inventarioData).filter(
                (p: any) => p.bodegaId === bodegaId
            ) || [];
            productosSinStock = inventarioList.filter(
                (p) => p.stockActual === 0
            ).length;
            productosStock10 = inventarioList.filter(
                (p) => p.stockActual > 0 && p.stockActual <= 10
            ).length;
        } catch (err) {
            console.warn('Error reading inventario.json:', err);
        }

        // Leer entregas
        try {
            const entregasData = await readFile(
                join(basePath, 'data', 'entregas.json'),
                'utf-8'
            );
            entregasList = JSON.parse(entregasData).filter(
                (e: any) => e.bodegaId === bodegaId
            ) || [];
            entregasPendientes = entregasList.filter(
                (e) => e.estado === 'pendiente'
            ).length;
        } catch (err) {
            console.warn('Error reading entregas.json:', err);
        }

        // Leer clientes
        try {
            const clientesData = await readFile(
                join(basePath, 'data', 'clientes.json'),
                'utf-8'
            );
            clientesList = (JSON.parse(clientesData) as Cliente[]).filter(
                (c) => c.bodegaId === bodegaId
            ) || [];
            totalClientes = clientesList.length;
            clientesFrecuentes = clientesList.filter((c) => c.estado === 'frecuente').length;
            clientesNuevos = clientesList.filter((c) => c.estado !== 'frecuente').length;
            topClientes = [...clientesList]
                .sort((a, b) => (b.gastTotal ?? 0) - (a.gastTotal ?? 0))
                .slice(0, 3);
        } catch (err) {
            console.warn('Error reading clientes.json:', err);
        }

        // Mock: Pedidos hoy (en producción vendría de DB)
        pedidosHoy = Math.floor(Math.random() * 10) + 3;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }

    // KPIs principales
    const kpis = [
        {
            label: 'Pedidos hoy',
            value: pedidosHoy.toString(),
            color: 'bg-blue-500',
            icon: '📋',
            href: `/bodega/${bodegaId}/pedidos?range=today`,
        },
        {
            label: 'Entregas pendientes',
            value: entregasPendientes.toString(),
            color: 'bg-yellow-500',
            icon: '🚚',
            href: `/bodega/${bodegaId}/pedidos?status=pendiente`,
        },
        {
            label: 'Sin stock',
            value: productosSinStock.toString(),
            color: 'bg-red-500',
            icon: '⚠️',
            href: `/bodega/${bodegaId}/productos?stock=zero`,
        },
        {
            label: 'Promos activas',
            value: promosActivas.toString(),
            color: 'bg-green-500',
            icon: '🎁',
            href: `/bodega/${bodegaId}/promociones?status=activas`,
        },
        {
            label: 'Clientes',
            value: totalClientes.toString(),
            color: 'bg-orange-500',
            icon: '👥',
            href: `/bodega/${bodegaId}/clientes`,
        },
    ];

    // Alertas dinámicas
    const alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string }> = [];

    if (productosSinStock > 0) {
        alerts.push({
            type: 'error',
            message: `⛔ ${productosSinStock} ${productosSinStock === 1 ? 'producto' : 'productos'} sin stock`
        });
    }

    if (productosStock10 > 0) {
        alerts.push({
            type: 'warning',
            message: `⚠️ ${productosStock10} ${productosStock10 === 1 ? 'producto' : 'productos'} con stock bajo (≤10)`
        });
    }

    if (entregasPendientes > 0) {
        alerts.push({
            type: 'info',
            message: `📦 ${entregasPendientes} ${entregasPendientes === 1 ? 'entrega' : 'entregas'} pendiente${entregasPendientes === 1 ? '' : 's'}`
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            type: 'info',
            message: '✅ Todo en orden. Sin alertas activas.'
        });
    }

    // Acciones rápidas
    const quickActions = [
        { label: 'Nuevo producto', emoji: '➕', href: `/bodega/${bodegaId}/productos?nuevo=1` },
        { label: 'Importar Excel', emoji: '📥', href: `/bodega/${bodegaId}/cargar-productos` },
        { label: 'Crear promoción', emoji: '🎯', href: `/bodega/${bodegaId}/promociones?nueva=1` },
        { label: 'Ver pedidos', emoji: '👁️', href: `/bodega/${bodegaId}/pedidos` },
        { label: 'Ver clientes', emoji: '👥', href: `/bodega/${bodegaId}/clientes` },
    ];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Dashboard — Bodega {bodegaId}
                </h1>
                <p className="text-gray-600">
                    Resumen de operaciones y acciones rápidas
                </p>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {kpis.map((kpi) => (
                    <Link
                        key={kpi.label}
                        href={kpi.href}
                        className={`${kpi.color} text-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs md:text-sm opacity-90 font-medium">
                                    {kpi.label}
                                </p>
                                <p className="text-2xl md:text-3xl font-bold mt-2">
                                    {kpi.value}
                                </p>
                                <p className="text-[11px] md:text-xs opacity-90 mt-3 underline">
                                    Ver detalle
                                </p>
                            </div>
                            <span className="text-2xl md:text-3xl">{kpi.icon}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Alertas */}
            {alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-3">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                        Alertas
                    </h2>
                    <div className="space-y-2">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`p-3 md:p-4 rounded-lg border-l-4 text-sm md:text-base ${alert.type === 'warning'
                                    ? 'bg-yellow-50 border-yellow-400 text-yellow-900'
                                    : alert.type === 'error'
                                        ? 'bg-red-50 border-red-400 text-red-900'
                                        : 'bg-blue-50 border-blue-400 text-blue-900'
                                    }`}
                            >
                                {alert.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clientes destacados */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Clientes</h2>
                    <Link
                        href={`/bodega/${bodegaId}/clientes`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                        Ver todos
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Frecuentes</p>
                        <p className="text-2xl font-bold text-gray-900">{clientesFrecuentes}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Nuevos</p>
                        <p className="text-2xl font-bold text-gray-900">{clientesNuevos}</p>
                    </div>
                </div>
                {topClientes.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">Top clientes</p>
                        <div className="grid gap-2">
                            {topClientes.map((cliente) => (
                                <div
                                    key={cliente.clienteId}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                                        <p className="text-xs text-gray-500">{cliente.zona || 'Zona N/D'}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                        {formatCurrency(cliente.gastTotal || 0)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No hay clientes registrados.</p>
                )}
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Acciones rápidas
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <span className="text-2xl md:text-3xl mb-1">{action.emoji}</span>
                            <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                                {action.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Módulos Principales */}
            <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Módulos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href={`/bodega/${bodegaId}/inventario`}
                        className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 md:p-6 rounded-lg hover:shadow-lg transition-shadow active:scale-95 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold mb-1">
                                    📦 Inventario
                                </h3>
                                <p className="text-xs md:text-sm opacity-90">
                                    {inventarioList.length} productos
                                </p>
                            </div>
                            <span className="text-3xl md:text-4xl opacity-50 group-hover:opacity-100 transition">
                                →
                            </span>
                        </div>
                    </Link>

                    <Link
                        href={`/bodega/${bodegaId}/pedidos`}
                        className="group bg-gradient-to-br from-green-500 to-green-600 text-white p-4 md:p-6 rounded-lg hover:shadow-lg transition-shadow active:scale-95 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold mb-1">
                                    🛒 Pedidos
                                </h3>
                                <p className="text-xs md:text-sm opacity-90">
                                    {pedidosHoy} hoy
                                </p>
                            </div>
                            <span className="text-3xl md:text-4xl opacity-50 group-hover:opacity-100 transition">
                                →
                            </span>
                        </div>
                    </Link>

                    <Link
                        href={`/bodega/${bodegaId}/logistica`}
                        className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-6 rounded-lg hover:shadow-lg transition-shadow active:scale-95 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold mb-1">
                                    🚚 Logística
                                </h3>
                                <p className="text-xs md:text-sm opacity-90">
                                    {entregasPendientes} entregas
                                </p>
                            </div>
                            <span className="text-3xl md:text-4xl opacity-50 group-hover:opacity-100 transition">
                                →
                            </span>
                        </div>
                    </Link>

                    <Link
                        href={`/bodega/${bodegaId}/clientes`}
                        className="group bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 md:p-6 rounded-lg hover:shadow-lg transition-shadow active:scale-95 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold mb-1">
                                    👥 Clientes
                                </h3>
                                <p className="text-xs md:text-sm opacity-90">
                                    Gestionar clientes
                                </p>
                            </div>
                            <span className="text-3xl md:text-4xl opacity-50 group-hover:opacity-100 transition">
                                →
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
