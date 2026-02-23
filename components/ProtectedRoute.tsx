// =============================================================================
// Componente: ProtectedRoute
// =============================================================================
// Componente para proteger páginas en el lado del cliente.
// Verifica autenticación y rol antes de mostrar el contenido.
// 
// Uso:
// <ProtectedRoute allowedRoles={['ADMIN', 'BODEGUERO']}>
//   <ContenidoProtegido />
// </ProtectedRoute>
// =============================================================================

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Tipos de roles permitidos
type Rol = 'ADMIN' | 'BODEGUERO' | 'CLIENTE';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Rol[]; // Si no se especifica, solo requiere estar autenticado
  redirectTo?: string;  // A dónde redirigir si no tiene acceso
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  // Obtener sesión del usuario
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Esperar a que termine de cargar la sesión
    if (status === 'loading') return;
    
    // Si no está autenticado, redirigir a login
    if (status === 'unauthenticated') {
      router.push(redirectTo);
      return;
    }
    
    // Si se especificaron roles permitidos, verificar
    if (allowedRoles && session?.user?.rol) {
      const userRole = session.user.rol as Rol;
      if (!allowedRoles.includes(userRole)) {
        // No tiene el rol necesario
        router.push('/no-autorizado');
      }
    }
  }, [status, session, allowedRoles, router, redirectTo]);
  
  // Mostrar loading mientras verifica
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚫</div>
          <p className="text-slate-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }
  
  // Si no está autenticado, no mostrar nada (se redirige en useEffect)
  if (status === 'unauthenticated') {
    return null;
  }
  
  // Verificar rol si se especificó
  if (allowedRoles && session?.user?.rol) {
    const userRole = session.user.rol as Rol;
    if (!allowedRoles.includes(userRole)) {
      return null; // Se redirige en useEffect
    }
  }
  
  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}
