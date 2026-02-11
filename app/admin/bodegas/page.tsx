"use client";

import { useEffect, useState } from 'react';

interface Bodega {
    bodega_id: string;
    nombre: string;
    categoria_principal: string;
    ciudad: string;
    zona: string;
    direccion: string;
    horario_texto: string;
    metodos_pago: string;
    min_pedido_cop: number;
    tiempo_entrega_estimado: string;
    estado: string;
    telefono: string;
    correo_pedidos: string;
}

export default function BodegasPage() {
    const [bodegas, setBodegas] = useState<Bodega[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');
    const [editingBodega, setEditingBodega] = useState<Bodega | null>(null);

    useEffect(() => {
        loadBodegas();
    }, []);

    const loadBodegas = async () => {
        try {
            const res = await fetch('/api/admin/bodegas');
            const data = await res.json();
            setBodegas(data.bodegas || []);
        } catch (error) {
            console.error('Error loading bodegas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEstado = async (bodega: Bodega) => {
        const nuevoEstado = bodega.estado === 'activo' ? 'inactivo' : 'activo';

        try {
            const res = await fetch('/api/admin/bodegas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bodega_id: bodega.bodega_id,
                    estado: nuevoEstado,
                }),
            });

            if (res.ok) {
                await loadBodegas();
            }
        } catch (error) {
            console.error('Error updating estado:', error);
        }
    };

    const handleUpdateBodega = async () => {
        if (!editingBodega) return;

        try {
            const res = await fetch('/api/admin/bodegas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingBodega),
            });

            if (res.ok) {
                await loadBodegas();
                setEditingBodega(null);
            }
        } catch (error) {
            console.error('Error updating bodega:', error);
        }
    };

    const filteredBodegas = bodegas.filter(b => {
        if (filter === 'todos') return true;
        return b.estado === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600">Cargando bodegas...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Bodegas</h1>
                <p className="text-slate-600 mt-2">Administrar bodegas registradas en el sistema</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <p className="text-sm text-slate-600">Total Bodegas</p>
                    <p className="text-2xl font-bold text-slate-900">{bodegas.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <p className="text-sm text-slate-600">Activas</p>
                    <p className="text-2xl font-bold text-green-600">
                        {bodegas.filter(b => b.estado === 'activo').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <p className="text-sm text-slate-600">Inactivas</p>
                    <p className="text-2xl font-bold text-red-600">
                        {bodegas.filter(b => b.estado === 'inactivo').length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('todos')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'todos'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Todas ({bodegas.length})
                    </button>
                    <button
                        onClick={() => setFilter('activo')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'activo'
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Activas ({bodegas.filter(b => b.estado === 'activo').length})
                    </button>
                    <button
                        onClick={() => setFilter('inactivo')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'inactivo'
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Inactivas ({bodegas.filter(b => b.estado === 'inactivo').length})
                    </button>
                </div>
            </div>

            {/* Bodegas Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Zona
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Min. Pedido
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Horario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredBodegas.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        No hay bodegas para mostrar
                                    </td>
                                </tr>
                            ) : (
                                filteredBodegas.map((bodega) => (
                                    <tr key={bodega.bodega_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-mono text-slate-900">{bodega.bodega_id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{bodega.nombre}</p>
                                                <p className="text-xs text-slate-500">{bodega.telefono}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {bodega.categoria_principal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-900">{bodega.zona}</p>
                                            <p className="text-xs text-slate-500">{bodega.ciudad}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900">
                                                ${bodega.min_pedido_cop?.toLocaleString('es-CO') || '0'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-600">{bodega.horario_texto}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bodega.estado === 'activo'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {bodega.estado === 'activo' ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingBodega(bodega)}
                                                    className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleToggleEstado(bodega)}
                                                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${bodega.estado === 'activo'
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {bodega.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingBodega && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-900">Editar Bodega</h2>
                            <p className="text-sm text-slate-600 mt-1">{editingBodega.bodega_id}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Pedido Mínimo (COP)
                                </label>
                                <input
                                    type="number"
                                    value={editingBodega.min_pedido_cop}
                                    onChange={(e) => setEditingBodega({
                                        ...editingBodega,
                                        min_pedido_cop: parseInt(e.target.value) || 0
                                    })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Horario
                                </label>
                                <input
                                    type="text"
                                    value={editingBodega.horario_texto}
                                    onChange={(e) => setEditingBodega({
                                        ...editingBodega,
                                        horario_texto: e.target.value
                                    })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Métodos de Pago
                                </label>
                                <input
                                    type="text"
                                    value={editingBodega.metodos_pago}
                                    onChange={(e) => setEditingBodega({
                                        ...editingBodega,
                                        metodos_pago: e.target.value
                                    })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="contraentrega|nequi:3120000000"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingBodega(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateBodega}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
