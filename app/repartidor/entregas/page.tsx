'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Entrega {
    id: string;
    bodegaId: string;
    pedidoId: string;
    tenderoNombre?: string;
    direccion?: string;
    zona?: string;
    repartidorId?: string;
    repartidorNombre?: string;
    estado: 'pendiente' | 'en_ruta' | 'entregada' | 'retrasada';
    etaMin?: number;
    createdAt: string;
}

export default function RepartidorEntregasPage() {
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEntregas();
    }, []);

    const fetchEntregas = async () => {
        try {
            // Por ahora, obtener todas las entregas
            const res = await fetch('/api/entregas', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setEntregas(data.entregas || []);
            }
        } catch (error) {
            console.error('Error fetching entregas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        const colors: Record<string, string> = {
            pendiente: 'bg-gray-100 text-gray-800',
            en_ruta: 'bg-blue-100 text-blue-800',
            entregada: 'bg-green-100 text-green-800',
            retrasada: 'bg-red-100 text-red-800',
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <div className="p-6">Cargando entregas...</div>;
    }

    // KPIs
    const pendientes = entregas.filter(e => e.estado === 'pendiente').length;
    const enRuta = entregas.filter(e => e.estado === 'en_ruta').length;
    const entregadas = entregas.filter(e => e.estado === 'entregada').length;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Mis Entregas</h1>
                    <p className="text-slate-600 mt-1">Gestiona tus entregas asignadas</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
                        <p className="text-sm text-slate-600 mb-1">Pendientes</p>
                        <p className="text-3xl font-bold text-slate-900">{pendientes}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <p className="text-sm text-slate-600 mb-1">En Ruta</p>
                        <p className="text-3xl font-bold text-slate-900">{enRuta}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <p className="text-sm text-slate-600 mb-1">Entregadas Hoy</p>
                        <p className="text-3xl font-bold text-slate-900">{entregadas}</p>
                    </div>
                </div>

                {/* Lista de entregas */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-slate-900">Entregas Asignadas</h2>
                    </div>

                    {entregas.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 mb-4">No tienes entregas asignadas</p>
                            <Link
                                href="/inicio"
                                className="inline-block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                                Volver al inicio
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {entregas.map((entrega) => (
                                <div key={entrega.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        {/* Info principal */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-semibold text-slate-900">
                                                    {entrega.tenderoNombre || 'Cliente sin nombre'}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoColor(entrega.estado)}`}>
                                                    {entrega.estado.replace('_', ' ')}
                                                </span>
                                                {!entrega.pedidoId ? (
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                        Sin ID
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-1">
                                                📍 {entrega.direccion || 'Dirección no disponible'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Pedido:{' '}
                                                <span className="font-mono">
                                                    {entrega.pedidoId ? `${entrega.pedidoId.slice(0, 8)}...` : 'No disponible'}
                                                </span>
                                            </p>
                                            {entrega.zona && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Zona: {entrega.zona}
                                                </p>
                                            )}
                                        </div>

                                        {/* ETA y acciones */}
                                        <div className="text-right">
                                            {entrega.etaMin ? (
                                                <p className="text-sm font-semibold text-blue-600 mb-2">
                                                    ETA: {entrega.etaMin} min
                                                </p>
                                            ) : null}
                                            {entrega.pedidoId ? (
                                                <Link
                                                    href={`/entregas/${encodeURIComponent(entrega.pedidoId)}`}
                                                    className="inline-block px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                                >
                                                    Ver detalles
                                                </Link>
                                            ) : (
                                                <button
                                                    className="px-3 py-1 bg-slate-200 text-slate-500 text-sm rounded cursor-not-allowed"
                                                    disabled
                                                    aria-disabled="true"
                                                >
                                                    Ver detalles
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Nota placeholder */}
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                        <strong>Nota:</strong> Este es un placeholder. En producción, aquí se mostrarían solo las entregas asignadas al repartidor actual.
                    </p>
                </div>
            </div>
        </div>
    );
}
