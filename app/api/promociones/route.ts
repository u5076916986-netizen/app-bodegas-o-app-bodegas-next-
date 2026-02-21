// =============================================================================
// API DE PROMOCIONES - /api/promociones
// =============================================================================
// Este endpoint maneja las operaciones para promociones y descuentos.
// 
// Endpoints disponibles:
//   GET  /api/promociones?bodegaId=BOD_001  → Obtener promociones de una bodega
//   POST /api/promociones                    → Crear una nueva promoción
//
// IMPORTANTE: El estado de las promociones se calcula dinámicamente basado
// en la fecha actual y las fechas de inicio/fin de cada promoción.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// =============================================================================
// FUNCIÓN AUXILIAR: Calcular estado de una promoción
// =============================================================================
// Esta función determina si una promoción está:
//   - "activa": Si la fecha actual está entre fechaInicio y fechaFin
//   - "programada": Si la fecha actual es anterior a fechaInicio
//   - "finalizada": Si la fecha actual es posterior a fechaFin
//
// Parámetros:
//   - fechaInicio: Fecha de inicio de la promoción
//   - fechaFin: Fecha de fin de la promoción
//
// Retorna: "activa" | "programada" | "finalizada"
// =============================================================================
function calcularEstadoPromocion(
  fechaInicio: Date,
  fechaFin: Date
): 'activa' | 'programada' | 'finalizada' {
  const ahora = new Date()
  
  // Si aún no ha comenzado
  if (ahora < fechaInicio) {
    return 'programada'
  }
  
  // Si ya terminó
  if (ahora > fechaFin) {
    return 'finalizada'
  }
  
  // Si está en el rango válido
  return 'activa'
}

// =============================================================================
// GET - Obtener promociones de una bodega
// =============================================================================
// Parámetros de consulta (query params):
//   - bodegaId: ID de la bodega (requerido)
//
// La respuesta incluye:
//   - Lista de promociones con estado calculado
//   - Conteo de promociones activas
//   - Total de promociones
//
// Ejemplo: GET /api/promociones?bodegaId=BOD_001
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

    // Consultamos las promociones de la bodega usando Prisma
    const promocionesDB = await prisma.promocion.findMany({
      where: {
        bodegaId: bodegaId,
      },
      orderBy: {
        fechaInicio: 'desc',  // Las más recientes primero
      },
    })

    // Calculamos el estado actual de cada promoción
    // IMPORTANTE: El estado se calcula dinámicamente, no se guarda en la BD
    const promociones = promocionesDB.map((promo) => {
      const estadoCalculado = calcularEstadoPromocion(
        new Date(promo.fechaInicio),
        new Date(promo.fechaFin)
      )
      
      return {
        ...promo,
        estado: estadoCalculado,  // Sobrescribimos con el estado calculado
        // Convertimos las fechas a formato ISO para la respuesta
        fechaInicio: promo.fechaInicio.toISOString(),
        fechaFin: promo.fechaFin.toISOString(),
      }
    })

    // Contamos las promociones activas
    const activas = promociones.filter(p => p.estado === 'activa').length

    // Retornamos la respuesta exitosa
    return NextResponse.json({
      success: true,
      data: promociones,
      total: promociones.length,
      activas: activas,
    })

  } catch (error) {
    console.error('Error al obtener promociones:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al obtener promociones',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Crear una nueva promoción
// =============================================================================
// Cuerpo de la petición (JSON):
//   - id: string (opcional, se genera automáticamente)
//   - bodegaId: string (requerido)
//   - nombre: string (requerido)
//   - tipo: "porcentaje" | "monto_fijo" (requerido)
//   - valor: number (requerido)
//   - fechaInicio: string ISO date (requerido)
//   - fechaFin: string ISO date (requerido)
//   - aplicaA: "categoria" | "producto" | "todos" (requerido)
//   - categoriaProductos: string[] (opcional)
//   - productosIds: string[] (opcional)
//
// Ejemplo de cuerpo:
// {
//   "bodegaId": "BOD_001",
//   "nombre": "Descuento de Verano",
//   "tipo": "porcentaje",
//   "valor": 15,
//   "fechaInicio": "2026-03-01T00:00:00Z",
//   "fechaFin": "2026-03-31T23:59:59Z",
//   "aplicaA": "categoria",
//   "categoriaProductos": ["Granos", "Lácteos"]
// }
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validamos los campos requeridos
    const camposRequeridos = [
      'bodegaId', 
      'nombre', 
      'tipo', 
      'valor', 
      'fechaInicio', 
      'fechaFin', 
      'aplicaA'
    ]
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

    // Validamos que aplicaA sea válido
    if (!['categoria', 'producto', 'todos'].includes(body.aplicaA)) {
      return NextResponse.json(
        {
          success: false,
          error: 'aplicaA debe ser "categoria", "producto" o "todos"',
        },
        { status: 400 }
      )
    }

    // Validamos las fechas
    const fechaInicio = new Date(body.fechaInicio)
    const fechaFin = new Date(body.fechaFin)

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Las fechas proporcionadas no son válidas',
        },
        { status: 400 }
      )
    }

    if (fechaFin <= fechaInicio) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha de fin debe ser posterior a la fecha de inicio',
        },
        { status: 400 }
      )
    }

    // Generamos un ID único si no se proporcionó
    const id = body.id || `PROMO_${Date.now()}`

    // Calculamos el estado inicial
    const estadoInicial = calcularEstadoPromocion(fechaInicio, fechaFin)

    // Creamos la promoción en la base de datos
    const nuevaPromocion = await prisma.promocion.create({
      data: {
        id,
        bodegaId: body.bodegaId,
        nombre: body.nombre,
        tipo: body.tipo,
        valor: parseFloat(body.valor),
        fechaInicio,
        fechaFin,
        aplicaA: body.aplicaA,
        categoriaProductos: body.categoriaProductos || [],
        productosIds: body.productosIds || [],
        estado: estadoInicial,
      },
    })

    // Retornamos la promoción creada
    return NextResponse.json(
      {
        success: true,
        message: 'Promoción creada exitosamente',
        data: {
          ...nuevaPromocion,
          fechaInicio: nuevaPromocion.fechaInicio.toISOString(),
          fechaFin: nuevaPromocion.fechaFin.toISOString(),
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error al crear promoción:', error)

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe una promoción con ese ID',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al crear promoción',
      },
      { status: 500 }
    )
  }
}
