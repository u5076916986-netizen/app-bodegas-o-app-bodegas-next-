"use client";

import { useEffect, useState } from 'react';

interface Tendero {
    id: string;
    email: string;
    name: string;
    nombreTienda?: string;
    zona?: string;
    fotoTienda?: string;
    createdAt: string;
    updatedAt: string;
    estado?: 'activo' | 'bloqueado';
}

export default function UsuariosPage() {
    const [tenderos, setTenderos] = useState<Tendero[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'activo' | 'bloqueado'>('todos');

    useEffect(() => {
        loadTenderos();
    }, []);

    const loadTenderos = async () => {
        try {
            const res = await fetch('/api/admin/usuarios');
            const data = await res.json();
            setTenderos(data.usuarios || []);
        } catch (error) {
            console.error('Error loading tenderos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEstado = async (tendero: Tendero) => {
        const nuevoEstado = tendero.estado === 'bloqueado' ? 'activo' : 'bloqueado';

        try {
            const res = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: tendero.email,
                    estado: nuevoEstado,
                }),
            });

            if (res.ok) {
                await loadTenderos();
            }
        } catch (error) {
            console.error('Error updating estado:', error);
        }
    };

    const filteredTenderos = tenderos.filter(t => {
        if (filter === 'todos') return true;
        return (t.estado || 'activo') === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
                <p className="text-slate-600 mt-2">Administrar tenderos registrados en el sistema</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <p className="text-sm text-slate-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-slate-900">{tenderos.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <p className="text-sm text-slate-600">Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                        {tenderos.filter(t => (t.estado || 'activo') === 'activo').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <p className="text-sm text-slate-600">Bloqueados</p>
                    <p className="text-2xl font-bold text-red-600">
                        {tenderos.filter(t => t.estado === 'bloqueado').length}
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
                        Todos ({tenderos.length})
                    </button>
                    <button
                        onClick={() => setFilter('activo')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'activo'
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Activos ({tenderos.filter(t => (t.estado || 'activo') === 'activo').length})
                    </button>
                    <button
                        onClick={() => setFilter('bloqueado')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'bloqueado'
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Bloqueados ({tenderos.filter(t => t.estado === 'bloqueado').length})
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Tienda
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Zona
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Foto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Registrado
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
                            {filteredTenderos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No hay usuarios para mostrar
                                    </td>
                                </tr>
                            ) : (
                                filteredTenderos.map((tendero) => (
                                    <tr key={tendero.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{tendero.name}</p>
                                                <p className="text-sm text-slate-500">{tendero.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-900">
                                                {tendero.nombreTienda || <span className="text-slate-400 italic">Sin nombre</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-900">
                                                {tendero.zona || <span className="text-slate-400 italic">Sin zona</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tendero.fotoTienda ? (
                                                <span className="text-green-600 text-sm">✓ Sí</span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">✗ No</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600">
                                                {new Date(tendero.createdAt).toLocaleDateString('es-CO')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(tendero.estado || 'activo') === 'activo'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {(tendero.estado || 'activo') === 'activo' ? 'Activo' : 'Bloqueado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleEstado(tendero)}
                                                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${(tendero.estado || 'activo') === 'activo'
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                {(tendero.estado || 'activo') === 'activo' ? 'Bloquear' : 'Activar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
