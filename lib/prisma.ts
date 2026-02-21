// =============================================================================
// CLIENTE PRISMA - Patrón Singleton
// =============================================================================
// Este archivo configura el cliente de Prisma usando el patrón Singleton.
// 
// ¿Por qué Singleton?
// En desarrollo, Next.js recarga el código frecuentemente (Hot Reload).
// Sin el patrón Singleton, cada recarga crearía una nueva conexión a la BD,
// eventualmente agotando el límite de conexiones.
//
// ¿Cómo funciona?
// 1. En DESARROLLO: Guardamos el cliente en `globalThis` para reutilizarlo
// 2. En PRODUCCIÓN: Creamos una instancia normal (Vercel maneja esto bien)
//
// USO:
//   import { prisma } from '@/lib/prisma'
//   const productos = await prisma.producto.findMany()
// =============================================================================

import { PrismaClient } from '@prisma/client'

// Extendemos el objeto global de Node.js para incluir nuestro cliente Prisma
// Esto es necesario para TypeScript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Creamos o reutilizamos la instancia de Prisma
// - Si ya existe en global (desarrollo), la reutilizamos
// - Si no existe, creamos una nueva instancia
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Configuración de logging (opcional)
  // Descomenta las siguientes líneas para ver las consultas SQL en consola
  // log: [
  //   { level: 'query', emit: 'stdout' },
  //   { level: 'error', emit: 'stdout' },
  //   { level: 'info', emit: 'stdout' },
  //   { level: 'warn', emit: 'stdout' },
  // ],
})

// En desarrollo, guardamos el cliente en el objeto global
// para evitar crear múltiples conexiones durante Hot Reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================
// Permite importar de dos formas:
//   import { prisma } from '@/lib/prisma'  // Named export
//   import prisma from '@/lib/prisma'      // Default export
// =============================================================================
export default prisma
