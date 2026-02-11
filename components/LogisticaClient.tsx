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
    updatedAt: string;
}

interface Pedido {
    pedidoId: string;
    bodegaId: string;
    total: number;
    estado: string;
    datosEntrega?: {
        nombre?: string;
        direccion?: string;
    };
}

export default function LogisticaClient({ bodegaId }: { bodegaId: string }) {
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState<string>('');
    const [filtroRepartidor, setFiltroRepartidor] = useState<string>('');
    const [buscarPedido, setBuscarPedido] = useState<string>('');
    const [showAsignarModal, setShowAsignarModal] = useState<string | null>(null);
    const [nuevoRepartidor, setNuevoRepartidor] = useState('');
    const [creatingFromPedidos, setCreatingFromPedidos] = useState(false);

    useEffect(() => {
        if (!bodegaId) return;
        fetchEntregas();
    }, [bodegaId, filtroEstado]);

    const fetchEntregas = async () => {
        try {
            const params = new URLSearchParams({ bodegaId });
            if (filtroEstado) params.append('estado', filtroEstado);

            const res = await fetch(`/api/entregas?${params.toString()}`, { cache: 'no-store' });
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

    const handleCrearEntregasDesdePedidos = async () => {
        if (!confirm('¿Crear entregas para todos los pedidos sin entrega asignada?')) return;
        setCreatingFromPedidos(true);
        try {
            // Obtener pedidos de la bodega
            const pedidosRes = await fetch(`/api/pedidos?bodegaId=${bodegaId}`, { cache: 'no-store' });
            if (!pedidosRes.ok) throw new Error('Error al obtener pedidos');

            const pedidosData = await pedidosRes.json();
            const pedidos: Pedido[] = pedidosData.pedidos || [];

            // Para cada pedido, verificar si ya tiene entrega
            for (const pedido of pedidos) {
                // Solo crear entrega para pedidos en estado "recibido" o "preparando"
                if (pedido.estado !== 'recibido' && pedido.estado !== 'preparando') continue;

                const existingRes = await fetch(`/api/entregas?pedidoId=${pedido.pedidoId}`, { cache: 'no-store' });
                const existingData = await existingRes.json();

                if (existingData.entregas && existingData.entregas.length > 0) continue;

                // Crear entrega
                await fetch('/api/entregas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bodegaId: pedido.bodegaId,
                        pedidoId: pedido.pedidoId,
                        tenderoNombre: pedido.datosEntrega?.nombre || 'Sin nombre',
                        direccion: pedido.datosEntrega?.direccion || 'Sin dirección',
                        zona: 'Sin zona'
                    })
                });
            }

            alert('Entregas creadas exitosamente');
            fetchEntregas();
        } catch (error) {
            console.error('Error creating entregas:', error);
            alert('Error al crear entregas');
        } finally {
            setCreatingFromPedidos(false);
        }
    };

    const handleCambiarEstado = async (entregaId: string, nuevoEstado: string) => {
        try {
            const res = await fetch(`/api/entregas/${entregaId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (res.ok) {
                fetchEntregas();
            } else {
                alert('Error al cambiar estado');
            }
        } catch (error) {
            console.error('Error changing estado:', error);
            alert('Error al cambiar estado');
        }
    };

    const handleAsignarRepartidor = async (entregaId: string) => {
        if (!nuevoRepartidor.trim()) {
            alert('Ingrese nombre del repartidor');
            return;
        }

        try {
            const res = await fetch(`/api/entregas/${entregaId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repartidorId: `REP_${Date.now()}`,
                    repartidorNombre: nuevoRepartidor
                })
            });

            if (res.ok) {
                setShowAsignarModal(null);
                setNuevoRepartidor('');
                fetchEntregas();
            } else {
                alert('Error al asignar repartidor');
            }
        } catch (error) {
            console.error('Error assigning repartidor:', error);
            alert('Error al asignar repartidor');
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

    // Filtrar entregas
    let entregasFiltradas = entregas;
    if (filtroRepartidor) {
        entregasFiltradas = entregasFiltradas.filter(e =>
            e.repartidorNombre?.toLowerCase().includes(filtroRepartidor.toLowerCase())
        );
    }
    if (buscarPedido) {
        entregasFiltradas = entregasFiltradas.filter(e =>
            e.pedidoId.toLowerCase().includes(buscarPedido.toLowerCase())
        );
    }

    // KPIs
    const pendientes = entregas.filter(e => e.estado === 'pendiente').length;
    const enRuta = entregas.filter(e => e.estado === 'en_ruta').length;
    const entregadas = entregas.filter(e => e.estado === 'entregada').length;
    const retrasadas = entregas.filter(e => e.estado === 'retrasada').length;

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    if (loading) return <div className="p-4">Cargando logística...</div>;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Entregas / Logística</h1>
                <button
                    onClick={handleCrearEntregasDesdePedidos}
                    disabled={creatingFromPedidos}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {creatingFromPedidos ? 'Creando...' : '+ Crear desde Pedidos'}
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pendientes', value: pendientes, color: 'bg-gray-500' },
                    { label: 'En Ruta', value: enRuta, color: 'bg-blue-500' },
                    { label: 'Entregadas', value: entregadas, color: 'bg-green-500' },
                    { label: 'Retrasadas', value: retrasadas, color: 'bg-red-500' },
                ].map((kpi) => (
                    <div key={kpi.label} className={`${kpi.color} text-white p-4 rounded-lg`}>
                        <p className="text-sm opacity-90">{kpi.label}</p>
                        <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Estado</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_ruta">En Ruta</option>
                            <option value="entregada">Entregada</option>
                            <option value="retrasada">Retrasada</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Repartidor</label>
                        <input
                            type="text"
                            value={filtroRepartidor}
                            onChange={(e) => setFiltroRepartidor(e.target.value)}
                            placeholder="Buscar por nombre"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Pedido ID</label>
                        <input
                            type="text"
                            value={buscarPedido}
                            onChange={(e) => setBuscarPedido(e.target.value)}
                            placeholder="Buscar por pedido"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de entregas */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Entregas ({entregasFiltradas.length})</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Pedido</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Cliente</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Dirección</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Repartidor</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">ETA (min)</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Estado</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entregasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                    No hay entregas disponibles
                                </td>
                            </tr>
                        ) : (
                            entregasFiltradas.map((entrega) => (
                                <tr key={entrega.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono">
                                        <Link
                                            href={`/pedidos/${entrega.pedidoId}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {entrega.pedidoId.slice(0, 8)}...
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{entrega.tenderoNombre || 'Sin nombre'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entrega.direccion || 'Sin dirección'}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {entrega.repartidorNombre || (
                                            <button
                                                onClick={() => setShowAsignarModal(entrega.id)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Asignar
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center">{entrega.etaMin || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(entrega.estado)}`}>
                                            {entrega.estado.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select
                                            value={entrega.estado}
                                            onChange={(e) => handleCambiarEstado(entrega.id, e.target.value)}
                                            className="border rounded px-2 py-1 text-xs"
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_ruta">En Ruta</option>
                                            <option value="entregada">Entregada</option>
                                            <option value="retrasada">Retrasada</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Asignar Repartidor */}
            {showAsignarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-bold mb-4">Asignar Repartidor</h3>
                        <input
                            type="text"
                            value={nuevoRepartidor}
                            onChange={(e) => setNuevoRepartidor(e.target.value)}
                            placeholder="Nombre del repartidor"
                            className="w-full border rounded px-3 py-2 mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowAsignarModal(null);
                                    setNuevoRepartidor('');
                                }}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAsignarRepartidor(showAsignarModal)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Asignar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
