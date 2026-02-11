'use client';

import { useState } from 'react';

export default function ConfiguracionClient({ bodegaId }: { bodegaId: string }) {
    const [formData, setFormData] = useState({
        nombre: 'Bodega Centro',
        ciudad: 'Bogotá',
        zona: 'Zona 1 - Centro',
        minimoOrden: 50000,
        tiempoEntrega: 2,
        horarioApertura: '06:00',
        horarioCierre: '20:00',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'minimoOrden' || name === 'tiempoEntrega' ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Guardando configuración:', formData);
        alert('Configuración guardada');
    };

    if (!bodegaId) {
        return <div className="p-4 text-red-600">Error: bodegaId no disponible</div>;
    }

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Configuración de Bodega</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <label className="block text-sm font-semibold mb-2">Nombre de la Bodega</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Ciudad</label>
                        <input
                            type="text"
                            name="ciudad"
                            value={formData.ciudad}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Zona</label>
                        <input
                            type="text"
                            name="zona"
                            value={formData.zona}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Mínimo de Orden (COP)</label>
                        <input
                            type="number"
                            name="minimoOrden"
                            value={formData.minimoOrden}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tiempo Entrega (horas)</label>
                        <input
                            type="number"
                            name="tiempoEntrega"
                            value={formData.tiempoEntrega}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Hora Apertura</label>
                        <input
                            type="time"
                            name="horarioApertura"
                            value={formData.horarioApertura}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Hora Cierre</label>
                        <input
                            type="time"
                            name="horarioCierre"
                            value={formData.horarioCierre}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Guardar Cambios
                    </button>
                    <button
                        type="reset"
                        className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-semibold"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
