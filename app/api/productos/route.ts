// =============================================================================
// API DE PRODUCTOS - /api/productos
// =============================================================================
// Este endpoint maneja las operaciones CRUD para productos.
// 
// Endpoints disponibles:
//   GET  /api/productos?bodegaId=BOD_001  → Obtener productos de una bodega
//   POST /api/productos                    → Crear un nuevo producto
//
// IMPORTANTE: Ahora usa Prisma en lugar de archivos JSON
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// =============================================================================
// GET - Obtener productos de una bodega
// =============================================================================
// Parámetros de consulta (query params):
//   - bodegaId: ID de la bodega (requerido)
//
// Ejemplo: GET /api/productos?bodegaId=BOD_001
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // Extraemos el bodegaId de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const bodegaId = searchParams.get('bodegaId')

    // Validamos que se haya proporcionado el bodegaId
    if (!bodegaId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El parámetro bodegaId es requerido' 
        },
        { status: 400 }
      )
    }

    // Consultamos los productos de la bodega usando Prisma
    // findMany retorna un array de productos
    const productos = await prisma.producto.findMany({
      where: {
        bodegaId: bodegaId,  // Filtramos por la bodega
      },
      orderBy: {
        nombre: 'asc',  // Ordenamos alfabéticamente por nombre
      },
    })

    // Retornamos la respuesta exitosa con los productos
    // Nota: incluimos "ok" para compatibilidad con código existente
    return NextResponse.json({
      success: true,
      ok: true,
      data: productos,
      total: productos.length,
    })

  } catch (error) {
    // Capturamos cualquier error y lo registramos
    console.error('Error al obtener productos:', error)
    
    // Retornamos una respuesta de error genérica
    // NOTA: En producción, evita exponer detalles del error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al obtener productos',
        // En desarrollo puedes incluir más detalles:
        // details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Crear un nuevo producto
// =============================================================================
// Cuerpo de la petición (JSON):
//   - id: string (opcional, se genera automáticamente)
//   - bodegaId: string (requerido)
//   - nombre: string (requerido)
//   - sku: string (requerido)
//   - categoria: string (requerido)
//   - precio: number (requerido)
//   - stock: number (opcional, default: 0)
//   - activo: boolean (opcional, default: true)
//   - descripcion: string (opcional)
//
// Ejemplo de cuerpo:
// {
//   "bodegaId": "BOD_001",
//   "nombre": "Arroz Premium 5kg",
//   "sku": "ARR-001",
//   "categoria": "Granos",
//   "precio": 15000,
//   "stock": 100,
//   "descripcion": "Arroz de alta calidad"
// }
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // Parseamos el cuerpo de la petición como JSON
    const body = await request.json()

    // Validamos los campos requeridos
    const camposRequeridos = ['bodegaId', 'nombre', 'sku', 'categoria', 'precio']
    const camposFaltantes = camposRequeridos.filter(campo => !body[campo])

    if (camposFaltantes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Generamos un ID único si no se proporcionó
    const id = body.id || `PROD_${Date.now()}`

    // Creamos el producto en la base de datos usando Prisma
    const nuevoProducto = await prisma.producto.create({
      data: {
        id,
        bodegaId: body.bodegaId,
        nombre: body.nombre,
        sku: body.sku,
        categoria: body.categoria,
        precio: parseFloat(body.precio),
        stock: parseInt(body.stock) || 0,
        activo: body.activo !== false,  // Por defecto es true
        descripcion: body.descripcion || null,
      },
    })

    // Retornamos el producto creado
    return NextResponse.json(
      {
        success: true,
        ok: true,
        message: 'Producto creado exitosamente',
        data: nuevoProducto,
      },
      { status: 201 }  // 201 = Created
    )

  } catch (error) {
    console.error('Error al crear producto:', error)

    // Verificamos si es un error de duplicado (ej: ID ya existe)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe un producto con ese ID o SKU',
        },
        { status: 409 }  // 409 = Conflict
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al crear producto',
      },
      { status: 500 }
    )
  }
}
