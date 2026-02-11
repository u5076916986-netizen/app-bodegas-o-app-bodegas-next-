'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Configuracion {
    sistema: {
        refreshRecomendacionMin: number;
        modoRecomendacion: 'reglas' | 'ia';
    };
    entregas: {
        costoBaseEnvio: number;
        umbralEntregaRapidaMin: number;
    };
    roles: {
        activarAdmin: boolean;
        activarRepartidor: boolean;
        activarBodega: boolean;
        activarTendero: boolean;
    };
}

export default function ConfiguracionPage() {
    const [config, setConfig] = useState<Configuracion | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'sistema' | 'entregas' | 'roles'>('sistema');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/configuracion', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            setMessage({ type: 'error', text: 'Error al cargar configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/configuracion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
                // Refrescar para confirmar persistencia
                setTimeout(() => fetchConfig(), 500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Error al guardar' });
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: 'Error de red al guardar' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚙️</div>
                    <p className="text-slate-600">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-slate-600">Error al cargar configuración</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin"
                            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
                        >
                            ← Volver al panel
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">Configuración del Sistema</h1>
                        <p className="text-slate-600 mt-2">Ajusta los parámetros globales de la aplicación</p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-100 border border-green-300 text-green-800'
                            : 'bg-red-100 border border-red-300 text-red-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-slate-200">
                    <div className="flex gap-4">
                        {[
                            { id: 'sistema' as const, label: 'Sistema', icon: '🔧' },
                            { id: 'entregas' as const, label: 'Entregas', icon: '🚚' },
                            { id: 'roles' as const, label: 'Roles', icon: '👥' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === tab.id
                                    ? 'border-purple-600 text-purple-700'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Sistema Tab */}
                    {activeTab === 'sistema' && (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="refresh-interval" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Intervalo de Actualización de Recomendaciones (minutos)
                                </label>
                                <input
                                    id="refresh-interval"
                                    type="number"
                                    min="1"
                                    max="1440"
                                    value={config.sistema.refreshRecomendacionMin}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            sistema: {
                                                ...config.sistema,
                                                refreshRecomendacionMin: parseInt(e.target.value) || 1,
                                            },
                                        })
                                    }
                                    className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-sm text-slate-500 mt-1">
                                    Frecuencia con la que se actualizan las recomendaciones automáticas
                                </p>
                            </div>

                            <div>
                                <label htmlFor="modo-recomendacion" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Modo de Recomendación
                                </label>
                                <select
                                    id="modo-recomendacion"
                                    value={config.sistema.modoRecomendacion}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            sistema: {
                                                ...config.sistema,
                                                modoRecomendacion: e.target.value as 'reglas' | 'ia',
                                            },
                                        })
                                    }
                                    className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="reglas">Basado en Reglas</option>
                                    <option value="ia">Inteligencia Artificial</option>
                                </select>
                                <p className="text-sm text-slate-500 mt-1">
                                    {config.sistema.modoRecomendacion === 'reglas'
                                        ? 'Usa mapeo manual de categorías complementarias'
                                        : 'Usa modelo de IA para recomendaciones personalizadas'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Entregas Tab */}
                    {activeTab === 'entregas' && (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="costo-envio" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Costo Base de Envío (COP)
                                </label>
                                <input
                                    id="costo-envio"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={config.entregas.costoBaseEnvio}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            entregas: {
                                                ...config.entregas,
                                                costoBaseEnvio: parseInt(e.target.value) || 0,
                                            },
                                        })
                                    }
                                    className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-sm text-slate-500 mt-1">
                                    Costo predeterminado para entregas estándar
                                </p>
                            </div>

                            <div>
                                <label htmlFor="umbral-rapida" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Umbral de Entrega Rápida (minutos)
                                </label>
                                <input
                                    id="umbral-rapida"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={config.entregas.umbralEntregaRapidaMin}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            entregas: {
                                                ...config.entregas,
                                                umbralEntregaRapidaMin: parseInt(e.target.value) || 30,
                                            },
                                        })
                                    }
                                    className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-sm text-slate-500 mt-1">
                                    Tiempo máximo para considerar una entrega como "rápida"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Roles Tab */}
                    {activeTab === 'roles' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-6">
                                Activa o desactiva roles específicos en el sistema
                            </p>

                            {[
                                { key: 'activarAdmin' as const, label: 'Administrador', icon: '⚙️' },
                                { key: 'activarRepartidor' as const, label: 'Repartidor', icon: '🚚' },
                                { key: 'activarBodega' as const, label: 'Bodega', icon: '🏪' },
                                { key: 'activarTendero' as const, label: 'Tendero', icon: '🛒' },
                            ].map((role) => (
                                <label
                                    key={role.key}
                                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{role.icon}</span>
                                        <span className="font-semibold text-slate-700">{role.label}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.roles[role.key]}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                roles: {
                                                    ...config.roles,
                                                    [role.key]: e.target.checked,
                                                },
                                            })
                                        }
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                    />
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                    <button
                        onClick={fetchConfig}
                        disabled={saving}
                        className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50 transition"
                    >
                        Recargar
                    </button>
                </div>
            </div>
        </div>
    );
}
