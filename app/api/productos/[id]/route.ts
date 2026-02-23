// =============================================================================
// API DE PRODUCTO INDIVIDUAL - /api/productos/[id]
// =============================================================================
// Este endpoint maneja operaciones CRUD para un producto específico.
//
// Endpoints disponibles:
//   GET    /api/productos/[id]  → Obtener un producto por ID
//   PUT    /api/productos/[id]  → Actualizar un producto
//   DELETE /api/productos/[id]  → Eliminar un producto
//
// IMPORTANTE: Usa Prisma para todas las operaciones de base de datos
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Tipos para los parámetros de la ruta
type RouteParams = {
  params: Promise<{ id: string }>
}

// =============================================================================
// GET - Obtener un producto por ID
// =============================================================================
// Retorna el producto completo con todos sus campos.
//
// Ejemplo: GET /api/productos/PROD_001
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Esperamos los parámetros (Next.js 15 hace params async)
    const { id } = await params

    // Buscamos el producto por ID
    const producto = await prisma.producto.findUnique({
      where: { id },
    })

    // Si no existe, retornamos 404
    if (!producto) {
      return NextResponse.json(
        {
          success: false,
          error: 'Producto no encontrado',
        },
        { status: 404 }
      )
    }

    // Retornamos el producto encontrado
    return NextResponse.json({
      success: true,
      ok: true,
      data: producto,
    })

  } catch (error) {
    console.error('Error al obtener producto:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT - Actualizar un producto
// =============================================================================
// Actualiza los campos proporcionados del producto.
// Solo se actualizan los campos que se envían en el cuerpo.
//
// Ejemplo: PUT /api/productos/PROD_001
// Body: { "nombre": "Nuevo nombre", "precio": 15000 }
// =============================================================================
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verificamos que el producto exista
    const productoExistente = await prisma.producto.findUnique({
      where: { id },
    })

    if (!productoExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Producto no encontrado',
        },
        { status: 404 }
      )
    }

    // Preparamos los datos a actualizar
    // Solo incluimos los campos que fueron enviados
    const datosActualizacion: Record<string, unknown> = {}

    // Campos de texto
    if (body.nombre !== undefined) datosActualizacion.nombre = body.nombre
    if (body.sku !== undefined) datosActualizacion.sku = body.sku
    if (body.categoria !== undefined) datosActualizacion.categoria = body.categoria
    if (body.descripcion !== undefined) datosActualizacion.descripcion = body.descripcion

    // Campos numéricos
    if (body.precio !== undefined) datosActualizacion.precio = parseFloat(body.precio)
    if (body.stock !== undefined) datosActualizacion.stock = parseInt(body.stock)

    // Campo booleano
    if (body.activo !== undefined) datosActualizacion.activo = body.activo

    // Validaciones básicas
    if (datosActualizacion.precio !== undefined && (datosActualizacion.precio as number) < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El precio no puede ser negativo',
        },
        { status: 400 }
      )
    }

    if (datosActualizacion.stock !== undefined && (datosActualizacion.stock as number) < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El stock no puede ser negativo',
        },
        { status: 400 }
      )
    }

    // Actualizamos el producto
    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: datosActualizacion,
    })

    return NextResponse.json({
      success: true,
      ok: true,
      message: 'Producto actualizado exitosamente',
      data: productoActualizado,
    })

  } catch (error) {
    console.error('Error al actualizar producto:', error)

    // Error de SKU duplicado
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe un producto con ese SKU',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Eliminar un producto
// =============================================================================
// Elimina permanentemente un producto de la base de datos.
// PRECAUCIÓN: Esta acción no se puede deshacer.
//
// Ejemplo: DELETE /api/productos/PROD_001
// =============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Verificamos que el producto exista
    const productoExistente = await prisma.producto.findUnique({
      where: { id },
    })

    if (!productoExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Producto no encontrado',
        },
        { status: 404 }
      )
    }

    // Eliminamos el producto
    await prisma.producto.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      ok: true,
      message: 'Producto eliminado exitosamente',
    })

  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
