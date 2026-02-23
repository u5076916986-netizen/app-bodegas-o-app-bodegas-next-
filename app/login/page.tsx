// =============================================================================
// Página: Login
// =============================================================================
// Formulario de inicio de sesión con email y contraseña.
// Usa NextAuth.js para manejar la autenticación.
// =============================================================================

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL a donde redirigir después del login
  const callbackUrl = searchParams.get('callbackUrl') || '/inicio';
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Intentar iniciar sesión con NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // No redirigir automáticamente
      });
      
      if (result?.error) {
        // Mostrar error al usuario
        setError(result.error);
      } else {
        // Login exitoso, redirigir
        router.push(callbackUrl);
        router.refresh(); // Refrescar para actualizar la sesión
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏪 App Bodegas
          </h1>
          <p className="text-slate-400">
            Inicia sesión para continuar
          </p>
        </div>
        
        {/* Tarjeta del formulario */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            Iniciar Sesión
          </h2>
          
          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Campo Contraseña */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Botón de enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚪</span>
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
          
          {/* Enlace a registro */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link 
                href="/registro" 
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
        
        {/* Credenciales de prueba (solo para desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2 font-medium">Usuarios de prueba:</p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>👑 Admin: admin@bodegas.com</p>
              <p>📦 Bodeguero: bodeguero@bodegas.com</p>
              <p>👤 Cliente: cliente@bodegas.com</p>
              <p className="text-slate-600">Contraseña: password123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
