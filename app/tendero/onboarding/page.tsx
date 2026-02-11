'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ZONAS = [
    'Centro',
    'Norte',
    'Sur',
    'Oriente',
    'Occidente',
    'Chapinero',
    'Usaquén',
    'Suba',
    'Engativá',
    'Fontibón',
    'Kennedy',
    'Bosa',
    'Ciudad Bolívar',
    'Otra',
];

export default function OnboardingPage() {
    const [nombreTienda, setNombreTienda] = useState('');
    const [zona, setZona] = useState('');
    const [loading, setLoading] = useState(false);
    const [tendero, setTendero] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Verificar si hay sesión
        const stored = localStorage.getItem('tendero');
        if (!stored) {
            router.push('/auth');
            return;
        }
        setTendero(JSON.parse(stored));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tendero) return;

        setLoading(true);

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
                // Actualizar localStorage
                localStorage.setItem('tendero', JSON.stringify(data.tendero));
                router.push('/tendero');
            } else {
                alert('Error al guardar perfil');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/tendero');
    };

    if (!tendero) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-600">Verificando sesión...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            1
                        </div>
                        <div className="w-16 h-1 bg-slate-200"></div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm">
                            2
                        </div>
                    </div>
                    <p className="text-center text-sm text-slate-600">Paso 1 de 2</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-6">
                        <div className="inline-block bg-blue-100 text-blue-600 rounded-full p-3 mb-3">
                            <span className="text-3xl">🏪</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            ¡Hola, {tendero.name}!
                        </h1>
                        <p className="text-slate-600">
                            Cuéntanos un poco sobre tu tienda (es rápido y opcional)
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nombre Tienda */}
                        <div>
                            <label htmlFor="nombreTienda" className="block text-sm font-semibold text-slate-700 mb-2">
                                Nombre de tu tienda <span className="text-slate-400 font-normal">(opcional)</span>
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
                                Zona o barrio <span className="text-slate-400 font-normal">(opcional)</span>
                            </label>
                            <select
                                id="zona"
                                value={zona}
                                onChange={(e) => setZona(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecciona tu zona</option>
                                {ZONAS.map((z) => (
                                    <option key={z} value={z}>
                                        {z}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition"
                            >
                                Omitir por ahora
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Continuar'}
                            </button>
                        </div>
                    </form>

                    <p className="text-xs text-slate-500 text-center mt-6">
                        Puedes completar o cambiar esta información más tarde en tu perfil
                    </p>
                </div>
            </div>
        </div>
    );
}
