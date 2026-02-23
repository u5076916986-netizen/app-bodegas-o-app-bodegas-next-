// =============================================================================
// API DE PROMOCIÓN INDIVIDUAL - /api/promociones/[id]
// =============================================================================
// Este endpoint maneja operaciones CRUD para una promoción específica.
//
// Endpoints disponibles:
//   GET    /api/promociones/[id]  → Obtener una promoción por ID
//   PUT    /api/promociones/[id]  → Actualizar una promoción
//   DELETE /api/promociones/[id]  → Eliminar una promoción
//
// IMPORTANTE: Ahora usa Prisma en lugar de archivos JSON
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Tipos para los parámetros de la ruta
type RouteParams = {
  params: Promise<{ id: string }>
}

// =============================================================================
// FUNCIÓN AUXILIAR: Calcular estado de una promoción
// =============================================================================
function calcularEstadoPromocion(
  fechaInicio: Date,
  fechaFin: Date
): 'activa' | 'programada' | 'finalizada' {
  const ahora = new Date()
  
  if (ahora < fechaInicio) return 'programada'
  if (ahora > fechaFin) return 'finalizada'
  return 'activa'
}

// =============================================================================
// GET - Obtener una promoción por ID
// =============================================================================
// Retorna la promoción completa con el estado calculado dinámicamente.
//
// Ejemplo: GET /api/promociones/PROMO_001
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Buscamos la promoción por ID
    const promocion = await prisma.promocion.findUnique({
      where: { id },
    })

    // Si no existe, retornamos 404
    if (!promocion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promoción no encontrada',
        },
        { status: 404 }
      )
    }

    // Calculamos el estado actual
    const estadoCalculado = calcularEstadoPromocion(
      new Date(promocion.fechaInicio),
      new Date(promocion.fechaFin)
    )

    // Retornamos la promoción con el estado calculado
    return NextResponse.json({
      success: true,
      ok: true,
      data: {
        ...promocion,
        estado: estadoCalculado,
        fechaInicio: promocion.fechaInicio.toISOString(),
        fechaFin: promocion.fechaFin.toISOString(),
      },
    })

  } catch (error) {
    console.error('Error al obtener promoción:', error)
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
// PUT - Actualizar una promoción
// =============================================================================
// Actualiza los campos proporcionados de la promoción.
// Solo se actualizan los campos que se envían en el cuerpo.
//
// Ejemplo: PUT /api/promociones/PROMO_001
// Body: { "nombre": "Nuevo nombre", "valor": 20 }
// =============================================================================
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verificamos que la promoción exista
    const promocionExistente = await prisma.promocion.findUnique({
      where: { id },
    })

    if (!promocionExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promoción no encontrada',
        },
        { status: 404 }
      )
    }

    // Preparamos los datos a actualizar
    const datosActualizacion: Record<string, unknown> = {}

    // Campos de texto
    if (body.nombre !== undefined) datosActualizacion.nombre = body.nombre
    if (body.tipo !== undefined) {
      // Validamos que el tipo sea válido
      if (!['porcentaje', 'monto_fijo'].includes(body.tipo)) {
        return NextResponse.json(
          {
            success: false,
            error: 'El tipo debe ser "porcentaje" o "monto_fijo"',
          },
          { status: 400 }
        )
      }
      datosActualizacion.tipo = body.tipo
    }

    // Campo numérico: valor
    if (body.valor !== undefined) {
      const valor = parseFloat(body.valor)
      if (isNaN(valor) || valor <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'El valor debe ser un número mayor a 0',
          },
          { status: 400 }
        )
      }
      datosActualizacion.valor = valor
    }

    // Fechas
    if (body.fechaInicio !== undefined) {
      const fecha = new Date(body.fechaInicio)
      if (isNaN(fecha.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'La fecha de inicio no es válida',
          },
          { status: 400 }
        )
      }
      datosActualizacion.fechaInicio = fecha
    }

    if (body.fechaFin !== undefined) {
      const fecha = new Date(body.fechaFin)
      if (isNaN(fecha.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'La fecha de fin no es válida',
          },
          { status: 400 }
        )
      }
      datosActualizacion.fechaFin = fecha
    }

    // Validar que fechaFin sea posterior a fechaInicio
    const fechaInicio = (datosActualizacion.fechaInicio as Date) || promocionExistente.fechaInicio
    const fechaFin = (datosActualizacion.fechaFin as Date) || promocionExistente.fechaFin
    if (fechaFin <= fechaInicio) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha de fin debe ser posterior a la fecha de inicio',
        },
        { status: 400 }
      )
    }

    // Campo aplicaA
    if (body.aplicaA !== undefined) {
      if (!['categoria', 'producto', 'todos'].includes(body.aplicaA)) {
        return NextResponse.json(
          {
            success: false,
            error: 'aplicaA debe ser "categoria", "producto" o "todos"',
          },
          { status: 400 }
        )
      }
      datosActualizacion.aplicaA = body.aplicaA
    }

    // Arrays
    if (body.categoriaProductos !== undefined) {
      datosActualizacion.categoriaProductos = body.categoriaProductos
    }
    if (body.productosIds !== undefined) {
      datosActualizacion.productosIds = body.productosIds
    }

    // Calculamos el nuevo estado
    const estadoCalculado = calcularEstadoPromocion(
      new Date(fechaInicio),
      new Date(fechaFin)
    )
    datosActualizacion.estado = estadoCalculado

    // Actualizamos la promoción
    const promocionActualizada = await prisma.promocion.update({
      where: { id },
      data: datosActualizacion,
    })

    return NextResponse.json({
      success: true,
      ok: true,
      message: 'Promoción actualizada exitosamente',
      data: {
        ...promocionActualizada,
        estado: estadoCalculado,
        fechaInicio: promocionActualizada.fechaInicio.toISOString(),
        fechaFin: promocionActualizada.fechaFin.toISOString(),
      },
    })

  } catch (error) {
    console.error('Error al actualizar promoción:', error)
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
// DELETE - Eliminar una promoción
// =============================================================================
// Elimina permanentemente una promoción de la base de datos.
// PRECAUCIÓN: Esta acción no se puede deshacer.
//
// Ejemplo: DELETE /api/promociones/PROMO_001
// =============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Verificamos que la promoción exista
    const promocionExistente = await prisma.promocion.findUnique({
      where: { id },
    })

    if (!promocionExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promoción no encontrada',
        },
        { status: 404 }
      )
    }

    // Eliminamos la promoción
    await prisma.promocion.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      ok: true,
      message: 'Promoción eliminada exitosamente',
    })

  } catch (error) {
    console.error('Error al eliminar promoción:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
