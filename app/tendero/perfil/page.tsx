'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TenderoPuntosCard from '@/components/TenderoPuntosCard';

export default function PerfilPage() {
    const [tendero, setTendero] = useState<any>(null);
    const [nombreTienda, setNombreTienda] = useState('');
    const [zona, setZona] = useState('');
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('tendero');
        if (!stored) {
            router.push('/auth');
            return;
        }

        const data = JSON.parse(stored);
        setTendero(data);
        setNombreTienda(data.nombreTienda || '');
        setZona(data.zona || '');
        if (data.fotoTienda) {
            setFotoPreview(data.fotoTienda);
        }
    }, [router]);

    const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !tendero) return;

        // Validar tamaño
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo no debe superar 5MB');
            return;
        }

        // Preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setFotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Subir archivo
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('email', tendero.email);

            const res = await fetch('/api/upload/foto-tienda', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                // Guardar URL en tendero
                const updated = { ...tendero, fotoTienda: data.url };
                setTendero(updated);
                localStorage.setItem('tendero', JSON.stringify(updated));

                // Actualizar en servidor
                await fetch('/api/tenderos', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: tendero.email,
                        fotoTienda: data.url,
                    }),
                });

                alert('Foto subida exitosamente');
            } else {
                const error = await res.json();
                alert(error.error || 'Error al subir foto');
                setFotoPreview(tendero.fotoTienda || null);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
            setFotoPreview(tendero.fotoTienda || null);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!tendero) return;

        setSaving(true);
        try {
            const res = await fetch('/api/tenderos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: tendero.email,
                    nombreTienda: nombreTienda || undefined,
                    zona: zona || undefined,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('tendero', JSON.stringify(data.tendero));
                setTendero(data.tendero);
                alert('Perfil actualizado');
            } else {
                alert('Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (!tendero) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-600">Cargando perfil...</p>
            </div>
        );
    }

    if (tendero.isGuest) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Modo Invitado</h1>
                    <p className="text-slate-600 mb-6">
                        Para acceder al perfil, inicia sesión con tu cuenta
                    </p>
                    <Link
                        href="/auth"
                        className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition"
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/tendero" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
                        ← Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
                    <p className="text-slate-600 mt-2">Administra la información de tu tienda</p>
                </div>

                <div id="puntos" className="mb-8">
                    <TenderoPuntosCard />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Sidebar - Foto */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Foto de la tienda</h2>

                            {/* Preview */}
                            <div className="mb-4">
                                {fotoPreview ? (
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100">
                                        <Image
                                            src={fotoPreview}
                                            alt="Foto de tienda"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-square rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                        <span className="text-4xl mb-2">🏪</span>
                                        <p className="text-sm">Sin foto</p>
                                    </div>
                                )}
                            </div>

                            {/* Upload Button */}
                            <label className="block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFotoChange}
                                    disabled={uploading}
                                    className="hidden"
                                />
                                <div className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 px-4 rounded-lg cursor-pointer transition disabled:opacity-50">
                                    {uploading ? 'Subiendo...' : 'Cambiar foto'}
                                </div>
                            </label>

                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Máximo 5MB. JPG, PNG o GIF
                            </p>
                        </div>
                    </div>

                    {/* Main - Información */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Información básica</h2>

                            <div className="space-y-5">
                                {/* Email (readonly) */}
                                <div>
                                    <label htmlFor="email-input" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email-input"
                                        type="email"
                                        value={tendero.email}
                                        disabled
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                    />
                                </div>

                                {/* Nombre (readonly) */}
                                <div>
                                    <label htmlFor="name-input" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        id="name-input"
                                        type="text"
                                        value={tendero.name}
                                        disabled
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                    />
                                </div>

                                {/* Nombre Tienda */}
                                <div>
                                    <label htmlFor="nombreTienda" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Nombre de la tienda
                                    </label>
                                    <input
                                        id="nombreTienda"
                                        type="text"
                                        value={nombreTienda}
                                        onChange={(e) => setNombreTienda(e.target.value)}
                                        placeholder="Ej: Tienda Don Pedro"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Zona */}
                                <div>
                                    <label htmlFor="zona" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Zona o barrio
                                    </label>
                                    <input
                                        id="zona"
                                        type="text"
                                        value={zona}
                                        onChange={(e) => setZona(e.target.value)}
                                        placeholder="Ej: Chapinero"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Botón Guardar */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
