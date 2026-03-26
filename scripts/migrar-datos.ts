// =============================================================================
// SCRIPT DE MIGRACIÓN DE DATOS - JSON a PostgreSQL
// =============================================================================
// Este script lee los datos de los archivos JSON y los inserta en PostgreSQL
// usando Prisma.
//
// ANTES DE EJECUTAR:
// 1. Asegúrate de tener la variable DATABASE_URL configurada en .env
// 2. Ejecuta: npx prisma migrate dev
// 3. Ejecuta: npx prisma generate
//
// PARA EJECUTAR:
//   npx ts-node scripts/migrar-datos.ts
//   Ó
//   npx tsx scripts/migrar-datos.ts
//
// NOTA: Este script puede ejecutarse múltiples veces. Si un registro ya existe,
// lo actualiza en lugar de fallar (upsert).
// =============================================================================

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Creamos una instancia del cliente Prisma
const prisma = new PrismaClient()

// =============================================================================
// INTERFACES - Definen la estructura de los datos JSON
// =============================================================================

// Estructura de un producto en el archivo JSON
interface ProductoJSON {
  id: string
  bodegaId: string
  nombre: string
  sku: string
  categoria: string
  precio: number
  stock: number
  activo: boolean
  descripcion?: string
  updatedAt?: string
}

// Estructura de una promoción en el archivo JSON
interface PromocionJSON {
  id: string
  bodegaId: string
  nombre: string
  tipo: string
  valor: number
  fechaInicio: string
  fechaFin: string
  aplicaA: string
  categoriaProductos?: string[]
  productosIds?: string[]
  estado?: string
}

// =============================================================================
// FUNCIÓN: Leer archivo JSON de forma segura
// =============================================================================
function leerArchivoJSON<T>(rutaRelativa: string): T[] {
  try {
    // Construimos la ruta absoluta desde la raíz del proyecto
    const rutaAbsoluta = path.join(process.cwd(), rutaRelativa)
    
    console.log(`\n📂 Leyendo archivo: ${rutaRelativa}`)
    
    // Verificamos que el archivo exista
    if (!fs.existsSync(rutaAbsoluta)) {
      console.log(`   ⚠️  Archivo no encontrado: ${rutaAbsoluta}`)
      return []
    }
    
    // Leemos y parseamos el JSON
    const contenido = fs.readFileSync(rutaAbsoluta, 'utf-8')
    const datos = JSON.parse(contenido)
    
    console.log(`   ✅ ${datos.length} registros encontrados`)
    return datos
    
  } catch (error) {
    console.error(`   ❌ Error al leer ${rutaRelativa}:`, error)
    return []
  }
}

// =============================================================================
// FUNCIÓN: Migrar productos
// =============================================================================
async function migrarProductos(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('📦 MIGRANDO PRODUCTOS')
  console.log('='.repeat(60))
  
  const productos = leerArchivoJSON<ProductoJSON>('data/productos.json')
  
  if (productos.length === 0) {
    console.log('   No hay productos para migrar')
    return
  }
  
  let exitosos = 0
  let errores = 0
  
  for (const producto of productos) {
    try {
      // Usamos upsert para crear o actualizar
      // Si el producto ya existe (mismo ID), lo actualiza
      // Si no existe, lo crea
      await prisma.producto.upsert({
        where: { id: producto.id },
        update: {
          bodegaId: producto.bodegaId,
          nombre: producto.nombre,
          sku: producto.sku,
          categoria: producto.categoria,
          precio: producto.precio,
          stock: producto.stock,
          activo: producto.activo,
          descripcion: producto.descripcion || null,
        },
        create: {
          id: producto.id,
          bodegaId: producto.bodegaId,
          nombre: producto.nombre,
          sku: producto.sku,
          categoria: producto.categoria,
          precio: producto.precio,
          stock: producto.stock,
          activo: producto.activo,
          descripcion: producto.descripcion || null,
        },
      })
      
      console.log(`   ✅ ${producto.nombre} (${producto.id})`)
      exitosos++
      
    } catch (error) {
      console.error(`   ❌ Error con ${producto.id}:`, error)
      errores++
    }
  }
  
  console.log(`\n   Resumen: ${exitosos} exitosos, ${errores} errores`)
}

// =============================================================================
// FUNCIÓN: Migrar promociones
// =============================================================================
async function migrarPromociones(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('🎁 MIGRANDO PROMOCIONES')
  console.log('='.repeat(60))
  
  const promociones = leerArchivoJSON<PromocionJSON>('data/promociones.json')
  
  if (promociones.length === 0) {
    console.log('   No hay promociones para migrar')
    return
  }
  
  let exitosos = 0
  let errores = 0
  
  for (const promo of promociones) {
    try {
      await prisma.promocion.upsert({
        where: { id: promo.id },
        update: {
          bodegaId: promo.bodegaId,
          titulo: promo.nombre,
          tipo: promo.tipo,
          valor: promo.valor,
          fechaInicio: new Date(promo.fechaInicio),
          fechaFin: new Date(promo.fechaFin),
          aplicaA: promo.aplicaA,
          categoriaProductos: promo.categoriaProductos || [],
          productosIds: promo.productosIds || [],
          estado: promo.estado || 'programada',
        },
        create: {
          id: promo.id,
          bodegaId: promo.bodegaId,
          titulo: promo.nombre,
          tipo: promo.tipo,
          valor: promo.valor,
          fechaInicio: new Date(promo.fechaInicio),
          fechaFin: new Date(promo.fechaFin),
          aplicaA: promo.aplicaA,
          categoriaProductos: promo.categoriaProductos || [],
          productosIds: promo.productosIds || [],
          estado: promo.estado || 'programada',
        },
      })
      
      console.log(`   ✅ ${promo.nombre} (${promo.id})`)
      exitosos++
      
    } catch (error) {
      console.error(`   ❌ Error con ${promo.id}:`, error)
      errores++
    }
  }
  
  console.log(`\n   Resumen: ${exitosos} exitosos, ${errores} errores`)
}

// =============================================================================
// FUNCIÓN: Verificar datos migrados
// =============================================================================
async function verificarMigracion(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 VERIFICANDO MIGRACIÓN')
  console.log('='.repeat(60))
  
  const totalProductos = await prisma.producto.count()
  const totalPromociones = await prisma.promocion.count()
  
  console.log(`\n   📦 Productos en la base de datos: ${totalProductos}`)
  console.log(`   🎁 Promociones en la base de datos: ${totalPromociones}`)
  
  // Mostramos algunos ejemplos
  console.log('\n   Ejemplo de productos:')
  const ejemploProductos = await prisma.producto.findMany({ take: 3 })
  ejemploProductos.forEach(p => {
    console.log(`      - ${p.nombre} ($${p.precio}) - Stock: ${p.stock}`)
  })
  
  console.log('\n   Ejemplo de promociones:')
  const ejemploPromociones = await prisma.promocion.findMany({ take: 3 })
  ejemploPromociones.forEach(p => {
    console.log(`      - ${p.titulo} (${p.valor}% ${p.tipo})`)
  })
}

// =============================================================================
// FUNCIÓN PRINCIPAL
// =============================================================================
async function main(): Promise<void> {
  console.log('\n')
  console.log('*'.repeat(60))
  console.log('*  SCRIPT DE MIGRACIÓN - App Bodegas                       *')
  console.log('*  Migrando datos de JSON a PostgreSQL                     *')
  console.log('*'.repeat(60))
  
  try {
    // Verificamos la conexión a la base de datos
    console.log('\n🔗 Conectando a la base de datos...')
    await prisma.$connect()
    console.log('   ✅ Conexión exitosa')
    
    // Ejecutamos las migraciones de datos
    await migrarProductos()
    await migrarPromociones()
    
    // Verificamos los resultados
    await verificarMigracion()
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE')
    console.log('='.repeat(60))
    console.log('\nPróximos pasos:')
    console.log('1. Ejecuta tu aplicación: npm run dev')
    console.log('2. Prueba los endpoints en el navegador')
    console.log('3. Verifica que los datos se muestren correctamente')
    console.log('\n')
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error)
    process.exit(1)
    
  } finally {
    // Siempre cerramos la conexión al terminar
    await prisma.$disconnect()
  }
}

// Ejecutamos la función principal
main()
