"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardMetrics {
    tenderos: number;
    bodegasActivas: number;
    pedidosHoy: number;
    entregasPendientes: number;
}

export default function AdminPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        tenderos: 0,
        bodegasActivas: 0,
        pedidosHoy: 0,
        entregasPendientes: 0,
    });

    useEffect(() => {
        // Load real metrics from files
        const loadMetrics = async () => {
            try {
                // Count tenderos
                const tenderosRes = await fetch('/api/admin/usuarios');
                const tenderosData = await tenderosRes.json();
                const tenderosCount = tenderosData.usuarios?.length || 0;

                // Count bodegas (from CSV parsing or mock)
                const bodegasCount = 12; // Mock for now, will read from CSV

                // Count pedidos today (from pedidos.json)
                const pedidosRes = await fetch('/api/pedidos');
                const pedidosData = await pedidosRes.json();
                const today = new Date().toISOString().split('T')[0];
                const pedidosHoy = pedidosData.pedidos?.filter((p: any) =>
                    p.createdAt?.startsWith(today)
                ).length || 0;

                // Mock entregas pendientes
                const entregasPendientes = Math.floor(pedidosHoy * 0.4);

                setMetrics({
                    tenderos: tenderosCount,
                    bodegasActivas: bodegasCount,
                    pedidosHoy,
                    entregasPendientes,
                });
            } catch (error) {
                console.error('Error loading metrics:', error);
            }
        };

        loadMetrics();
    }, []);

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
                <p className="text-slate-600 mt-2">Gestiona el sistema de bodegas</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Tenderos</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.tenderos}</p>
                            <p className="text-xs text-slate-500 mt-1">Usuarios registrados</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl">👥</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Bodegas Activas</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.bodegasActivas}</p>
                            <p className="text-xs text-slate-500 mt-1">Disponibles</p>
                        </div>
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl">🏪</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Pedidos Hoy</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.pedidosHoy}</p>
                            <p className="text-xs text-slate-500 mt-1">Órdenes creadas</p>
                        </div>
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl">📦</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Entregas Pendientes</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.entregasPendientes}</p>
                            <p className="text-xs text-slate-500 mt-1">En camino</p>
                        </div>
                        <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl">🚚</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/usuarios"
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">👥</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Gestionar Usuarios</h3>
                            <p className="text-sm text-slate-600">Administrar tenderos del sistema</p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/bodegas"
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-green-300 transition-all"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🏪</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Gestionar Bodegas</h3>
                            <p className="text-sm text-slate-600">Configurar bodegas y productos</p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/configuracion"
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-300 transition-all"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">⚙️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Configuración</h3>
                            <p className="text-sm text-slate-600">Ajustes del sistema</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
