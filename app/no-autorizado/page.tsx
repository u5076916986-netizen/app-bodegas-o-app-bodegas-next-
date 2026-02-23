// =============================================================================
// Página: No Autorizado
// =============================================================================
// Se muestra cuando el usuario intenta acceder a una ruta sin permisos.
// =============================================================================

import Link from 'next/link';

export default function NoAutorizadoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Icono de candado */}
        <div className="text-8xl mb-6">🔒</div>
        
        {/* Título */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Acceso No Autorizado
        </h1>
        
        {/* Mensaje */}
        <p className="text-slate-400 mb-8 max-w-md">
          No tienes permisos para acceder a esta página.
          Si crees que esto es un error, contacta al administrador.
        </p>
        
        {/* Botones de acción */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/inicio"
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
          >
            Ir al Inicio
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Cambiar de Cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
