// =============================================================================
// lib/auth.ts - Utilidades de Autenticación
// =============================================================================
// Este archivo contiene funciones helper para manejar la autenticación:
// - hashPassword: Hashea contraseñas antes de guardarlas
// - verifyPassword: Verifica si una contraseña es correcta
// - getServerAuthSession: Obtiene la sesión del usuario en el servidor
// =============================================================================

import bcryptjs from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Número de rondas de salt para bcrypt (10 es un buen balance seguridad/velocidad)
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña usando bcryptjs
 * SIEMPRE usar esta función antes de guardar una contraseña en la base de datos
 * 
 * @param password - Contraseña en texto plano
 * @returns Contraseña hasheada
 * 
 * Ejemplo:
 * const hashedPassword = await hashPassword('miContraseña123');
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Verifica si una contraseña coincide con su hash
 * Usar para validar el login del usuario
 * 
 * @param password - Contraseña en texto plano ingresada por el usuario
 * @param hashedPassword - Hash almacenado en la base de datos
 * @returns true si coinciden, false si no
 * 
 * Ejemplo:
 * const isValid = await verifyPassword('miContraseña123', user.password);
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

/**
 * Obtiene la sesión del usuario actual en el servidor
 * Usar en Server Components o API Routes
 * 
 * @returns Sesión del usuario o null si no está autenticado
 * 
 * Ejemplo:
 * const session = await getServerAuthSession();
 * if (!session) {
 *   redirect('/login');
 * }
 */
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Tipos de roles para usar en TypeScript
 */
export type UserRole = 'ADMIN' | 'BODEGUERO' | 'CLIENTE';

/**
 * Verifica si el usuario tiene un rol específico
 * 
 * @param userRole - Rol del usuario actual
 * @param allowedRoles - Lista de roles permitidos
 * @returns true si el usuario tiene permiso
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Verifica si el usuario puede acceder a una bodega específica
 * - ADMIN: puede acceder a cualquier bodega
 * - BODEGUERO: solo puede acceder a su bodega asignada
 * - CLIENTE: puede ver cualquier bodega (pero acceso limitado)
 */
export function canAccessBodega(
  userRole: UserRole,
  userBodegaId: string | null,
  targetBodegaId: string
): boolean {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'BODEGUERO') return userBodegaId === targetBodegaId;
  if (userRole === 'CLIENTE') return true; // Clientes pueden ver bodegas
  return false;
}
