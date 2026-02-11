'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setLoading(true);
        // En producción, esto redirigiría a Google OAuth
        // Para MVP, simulamos con un email mock
        try {
            const mockUser = {
                email: 'tendero@demo.com',
                name: 'Tendero Demo',
                picture: null,
            };

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockUser),
            });

            if (res.ok) {
                const data = await res.json();
                // Guardar en localStorage para demo
                localStorage.setItem('tendero', JSON.stringify(data.tendero));

                // Verificar si necesita onboarding
                if (!data.tendero.nombreTienda) {
                    router.push('/tendero/onboarding');
                } else {
                    router.push('/tendero');
                }
            }
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestMode = () => {
        // Modo invitado: sin guardar nada
        const guestUser = {
            email: 'invitado@local.com',
            name: 'Invitado',
            isGuest: true,
        };
        localStorage.setItem('tendero', JSON.stringify(guestUser));
        router.push('/tendero');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-blue-600 text-white rounded-full p-4 mb-4">
                        <span className="text-4xl">🛒</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        APP Bodegas
                    </h1>
                    <p className="text-slate-600">
                        Tu tienda en línea, fácil y rápido
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                        ¡Bienvenido!
                    </h2>
                    <p className="text-slate-600 text-center mb-8">
                        Sin contraseñas. Entra en 10 segundos.
                    </p>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 mb-4 disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {loading ? 'Ingresando...' : 'Continuar con Google'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">o</span>
                        </div>
                    </div>

                    {/* Guest Mode */}
                    <button
                        onClick={handleGuestMode}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition"
                    >
                        Entrar como invitado
                    </button>

                    {/* Info */}
                    <p className="text-xs text-slate-500 text-center mt-6">
                        Al continuar, aceptas nuestros términos de servicio y política de privacidad
                    </p>
                </div>

                {/* Benefits */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl mb-1">⚡</div>
                        <p className="text-xs text-slate-600 font-medium">Súper rápido</p>
                    </div>
                    <div>
                        <div className="text-2xl mb-1">🔒</div>
                        <p className="text-xs text-slate-600 font-medium">100% seguro</p>
                    </div>
                    <div>
                        <div className="text-2xl mb-1">📱</div>
                        <p className="text-xs text-slate-600 font-medium">Desde tu cel</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
