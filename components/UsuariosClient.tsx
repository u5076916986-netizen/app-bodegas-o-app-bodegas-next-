'use client';

import { useEffect, useState } from 'react';

interface Usuario {
    usuarioId: string;
    bodegaId: string;
    nombre: string;
    email: string;
    rol: 'admin' | 'vendedor' | 'logistica' | 'contador';
    estado: 'activo' | 'inactivo';
    ultimaActividad: string;
}

export default function UsuariosClient({ bodegaId }: { bodegaId: string }) {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newUsuario, setNewUsuario] = useState({ nombre: '', email: '', rol: 'vendedor' });

    useEffect(() => {
        if (!bodegaId) return;
        fetchUsuarios();
    }, [bodegaId]);

    const fetchUsuarios = async () => {
        try {
            const response = await fetch(
                `/api/bodega/${bodegaId}/usuarios`,
                { cache: 'no-store' }
            );
            if (response.ok) {
                const data = await response.json();
                setUsuarios(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUsuario = () => {
        if (newUsuario.nombre && newUsuario.email) {
            console.log('Agregando usuario:', newUsuario);
            setShowForm(false);
            setNewUsuario({ nombre: '', email: '', rol: 'vendedor' });
        }
    };

    const handleDeleteUsuario = (usuarioId: string) => {
        console.log('Eliminando usuario:', usuarioId);
        setUsuarios((prev) => prev.filter((u) => u.usuarioId !== usuarioId));
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('es-CO').format(new Date(dateString));
    };

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    if (loading) return <div className="p-4">Cargando usuarios...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Usuarios</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                    + Agregar Usuario
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Nuevo Usuario</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Nombre</label>
                            <input
                                type="text"
                                value={newUsuario.nombre}
                                onChange={(e) => setNewUsuario({ ...newUsuario, nombre: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                value={newUsuario.email}
                                onChange={(e) => setNewUsuario({ ...newUsuario, email: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Rol</label>
                            <select
                                value={newUsuario.rol}
                                onChange={(e) => setNewUsuario({ ...newUsuario, rol: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="vendedor">Vendedor</option>
                                <option value="admin">Admin</option>
                                <option value="logistica">Logística</option>
                                <option value="contador">Contador</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddUsuario}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Guardar
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Rol</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Estado</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Última Actividad</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((usuario) => (
                            <tr key={usuario.usuarioId} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium">{usuario.nombre}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-semibold">
                                        {usuario.rol}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${usuario.estado === 'activo'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {usuario.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(usuario.ultimaActividad)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleDeleteUsuario(usuario.usuarioId)}
                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
