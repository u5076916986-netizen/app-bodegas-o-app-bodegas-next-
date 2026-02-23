// =============================================================================
// Middleware de Autenticación y Autorización
// =============================================================================
// Este middleware protege las rutas según el rol del usuario.
// Se ejecuta ANTES de que se procese cada request.
// 
// Rutas protegidas:
// - /admin/*    → Solo ADMIN
// - /bodega/*   → ADMIN o BODEGUERO
// - /api/*      → Según el endpoint específico
// =============================================================================

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Rutas públicas (no requieren autenticación)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/registro',
  '/inicio',
  '/api/auth',
  '/api/bodegas',
];

// Rutas que solo pueden acceder los ADMIN
const ADMIN_ROUTES = [
  '/admin',
];

// Rutas para BODEGUERO (y ADMIN)
const BODEGUERO_ROUTES = [
  '/bodega',
  '/bodegas',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Permitir rutas públicas sin verificación
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Rutas de recursos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // archivos estáticos
  ) {
    return NextResponse.next();
  }
  
  // Rutas de API de auth siempre permitidas
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // 2. Obtener token JWT del usuario
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // 3. Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // 4. Si no hay token y no es ruta pública, redirigir a login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 5. Verificar permisos según el rol
  const userRole = token.rol as string;
  
  // Rutas de ADMIN
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (isAdminRoute && userRole !== 'ADMIN') {
    // No tiene permiso, redirigir a página de no autorizado
    return NextResponse.redirect(new URL('/no-autorizado', request.url));
  }
  
  // Rutas de BODEGUERO
  const isBodegueroRoute = BODEGUERO_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (isBodegueroRoute && !['ADMIN', 'BODEGUERO'].includes(userRole)) {
    return NextResponse.redirect(new URL('/no-autorizado', request.url));
  }
  
  // 6. Si pasó todas las verificaciones, permitir acceso
  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  // Aplicar a todas las rutas excepto archivos estáticos
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
