'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface Pedido {
    pedidoId: string;
    bodegaId: string;
    clienteNombre: string;
    direccion: string;
    total: number;
    estado: 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';
    timestamp: string;
    items: any[];
}

interface Entrega {
    id: string;
    pedidoId: string;
    estado: 'pendiente' | 'en_ruta' | 'entregada' | 'retrasada';
}

export default function PedidosClient({ bodegaId }: { bodegaId: string }) {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [entregas, setEntregas] = useState<Record<string, Entrega>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('todos');
    const [range, setRange] = useState<'all' | 'today'>('all');
    const searchParams = useSearchParams();
    const filterAppliedRef = useRef(false);

    useEffect(() => {
        if (!bodegaId) return;
        fetchData();
    }, [bodegaId]);

    useEffect(() => {
        if (filterAppliedRef.current) return;
        const status = searchParams.get('status');
        const rangeParam = searchParams.get('range');

        if (status && ['todos', 'pendiente', 'confirmado', 'entregado', 'cancelado'].includes(status)) {
            setFilter(status);
        }

        if (rangeParam === 'today') {
            setRange('today');
        }

        if (status || rangeParam) {
            filterAppliedRef.current = true;
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            // Obtener pedidos
            const pedidosRes = await fetch('/api/pedidos', { cache: 'no-store' });
            if (pedidosRes.ok) {
                const data = await pedidosRes.json();
                const filtered = (data.data || []).filter(
                    (p: Pedido) => p.bodegaId === bodegaId
                );
                setPedidos(filtered);
            }

            // Obtener entregas para esta bodega
            const entregasRes = await fetch(`/api/entregas?bodegaId=${bodegaId}`, { cache: 'no-store' });
            if (entregasRes.ok) {
                const data = await entregasRes.json();
                const entregasMap: Record<string, Entrega> = {};
                (data.entregas || []).forEach((e: Entrega) => {
                    entregasMap[e.pedidoId] = e;
                });
                setEntregas(entregasMap);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los pedidos. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const formatCOP = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('es-CO').format(new Date(dateString));
    };

    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
        );
    };

    const getEstadoColor = (estado: string) => {
        const colors: Record<string, string> = {
            pendiente: 'bg-yellow-100 text-yellow-800',
            confirmado: 'bg-blue-100 text-blue-800',
            entregado: 'bg-green-100 text-green-800',
            cancelado: 'bg-red-100 text-red-800',
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoEntregaColor = (estado: string) => {
        const colors: Record<string, string> = {
            pendiente: 'bg-gray-100 text-gray-700',
            en_ruta: 'bg-blue-100 text-blue-700',
            entregada: 'bg-green-100 text-green-700',
            retrasada: 'bg-red-100 text-red-700',
        };
        return colors[estado] || 'bg-gray-100 text-gray-700';
    };

    const filteredPedidos = pedidos.filter((pedido) => {
        if (range === 'today' && !isToday(pedido.timestamp)) return false;
        if (filter !== 'todos' && pedido.estado !== filter) return false;
        return true;
    });

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Pedidos</h1>
            {range === 'today' ? (
                <p className="text-sm text-gray-600">Mostrando pedidos de hoy</p>
            ) : null}

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => { setError(null); fetchData(); }} className="text-red-600 hover:text-red-800 font-semibold text-xs ml-4">
                        Reintentar
                    </button>
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                {['todos', 'pendiente', 'confirmado', 'entregado'].map((estado) => (
                    <button
                        key={estado}
                        onClick={() => setFilter(estado)}
                        className={`px-4 py-2 rounded font-semibold transition ${filter === estado
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                    >
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <SkeletonTable rows={5} cols={4} />
            ) : filteredPedidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <p className="text-lg font-semibold text-slate-700">
                        {filter !== 'todos' ? `No hay pedidos con estado "${filter}"` : 'No hay pedidos aún'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        {filter !== 'todos' ? 'Prueba cambiando el filtro' : 'Los pedidos de tus clientes aparecerán aquí'}
                    </p>
                    {filter !== 'todos' && (
                        <button onClick={() => setFilter('todos')} className="mt-4 text-blue-600 text-sm hover:underline">
                            Ver todos los pedidos
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPedidos.map((pedido) => {
                        const entrega = entregas[pedido.pedidoId];
                        return (
                            <div key={pedido.pedidoId} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Pedido #{pedido.pedidoId.slice(0, 8)}</p>
                                        <p className="text-lg font-semibold">{pedido.clienteNombre}</p>
                                        <p className="text-sm text-gray-600">{pedido.direccion}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(
                                                pedido.estado
                                            )}`}
                                        >
                                            {pedido.estado}
                                        </span>
                                        {entrega && (
                                            <Link
                                                href={`/bodega/${bodegaId}/logistica?pedidoId=${pedido.pedidoId}`}
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoEntregaColor(entrega.estado)}`}
                                            >
                                                Entrega: {entrega.estado.replace('_', ' ')}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-gray-600">{formatDate(pedido.timestamp)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">{formatCOP(pedido.total)}</p>
                                        <a
                                            href={`/pedidos/${pedido.pedidoId}`}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Ver detalle →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
