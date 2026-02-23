// =============================================================================
// FUNCIONES DE VALIDACIÓN
// =============================================================================
// Este archivo contiene funciones para validar datos de productos y promociones.
// Se usan tanto en el cliente como en el servidor para garantizar consistencia.
// =============================================================================

// =============================================================================
// TIPOS DE ERRORES DE VALIDACIÓN
// =============================================================================

export interface ValidationError {
  campo: string       // Nombre del campo con error
  mensaje: string     // Mensaje de error en español
}

export interface ValidationResult {
  esValido: boolean           // true si todos los campos son válidos
  errores: ValidationError[]  // Lista de errores encontrados
}

// =============================================================================
// VALIDACIÓN DE PRODUCTOS
// =============================================================================

export interface ProductoParaValidar {
  nombre?: string
  sku?: string
  categoria?: string
  precio?: number | string
  stock?: number | string
  activo?: boolean
  descripcion?: string
}

/**
 * Valida los datos de un producto.
 * @param producto - Los datos del producto a validar
 * @param esCreacion - true si es un nuevo producto, false si es actualización
 * @returns Resultado de la validación con lista de errores
 */
export function validarProducto(
  producto: ProductoParaValidar,
  esCreacion: boolean = true
): ValidationResult {
  const errores: ValidationError[] = []

  // Validar nombre (requerido en creación)
  if (esCreacion || producto.nombre !== undefined) {
    if (!producto.nombre || producto.nombre.trim() === '') {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre del producto es obligatorio',
      })
    } else if (producto.nombre.length < 2) {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre debe tener al menos 2 caracteres',
      })
    } else if (producto.nombre.length > 200) {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre no puede exceder 200 caracteres',
      })
    }
  }

  // Validar SKU (requerido en creación)
  if (esCreacion || producto.sku !== undefined) {
    if (!producto.sku || producto.sku.trim() === '') {
      errores.push({
        campo: 'sku',
        mensaje: 'El SKU del producto es obligatorio',
      })
    } else if (producto.sku.length > 50) {
      errores.push({
        campo: 'sku',
        mensaje: 'El SKU no puede exceder 50 caracteres',
      })
    }
  }

  // Validar precio
  if (producto.precio !== undefined) {
    const precio = typeof producto.precio === 'string' 
      ? parseFloat(producto.precio) 
      : producto.precio
    
    if (isNaN(precio)) {
      errores.push({
        campo: 'precio',
        mensaje: 'El precio debe ser un número válido',
      })
    } else if (precio < 0) {
      errores.push({
        campo: 'precio',
        mensaje: 'El precio no puede ser negativo',
      })
    }
  } else if (esCreacion) {
    errores.push({
      campo: 'precio',
      mensaje: 'El precio del producto es obligatorio',
    })
  }

  // Validar stock
  if (producto.stock !== undefined) {
    const stock = typeof producto.stock === 'string' 
      ? parseInt(producto.stock) 
      : producto.stock
    
    if (isNaN(stock)) {
      errores.push({
        campo: 'stock',
        mensaje: 'El stock debe ser un número entero',
      })
    } else if (stock < 0) {
      errores.push({
        campo: 'stock',
        mensaje: 'El stock no puede ser negativo',
      })
    }
  }

  // Validar descripción (opcional pero con límite)
  if (producto.descripcion && producto.descripcion.length > 1000) {
    errores.push({
      campo: 'descripcion',
      mensaje: 'La descripción no puede exceder 1000 caracteres',
    })
  }

  return {
    esValido: errores.length === 0,
    errores,
  }
}

// =============================================================================
// VALIDACIÓN DE PROMOCIONES
// =============================================================================

export interface PromocionParaValidar {
  nombre?: string
  tipo?: string
  valor?: number | string
  fechaInicio?: string | Date
  fechaFin?: string | Date
  aplicaA?: string
  categoriaProductos?: string[]
  productosIds?: string[]
}

/**
 * Valida los datos de una promoción.
 * @param promocion - Los datos de la promoción a validar
 * @param esCreacion - true si es una nueva promoción, false si es actualización
 * @returns Resultado de la validación con lista de errores
 */
export function validarPromocion(
  promocion: PromocionParaValidar,
  esCreacion: boolean = true
): ValidationResult {
  const errores: ValidationError[] = []

  // Validar nombre
  if (esCreacion || promocion.nombre !== undefined) {
    if (!promocion.nombre || promocion.nombre.trim() === '') {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre de la promoción es obligatorio',
      })
    } else if (promocion.nombre.length < 3) {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre debe tener al menos 3 caracteres',
      })
    } else if (promocion.nombre.length > 100) {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre no puede exceder 100 caracteres',
      })
    }
  }

  // Validar tipo
  if (esCreacion || promocion.tipo !== undefined) {
    const tiposValidos = ['porcentaje', 'monto_fijo']
    if (!promocion.tipo || !tiposValidos.includes(promocion.tipo)) {
      errores.push({
        campo: 'tipo',
        mensaje: 'El tipo debe ser "porcentaje" o "monto_fijo"',
      })
    }
  }

  // Validar valor
  if (promocion.valor !== undefined) {
    const valor = typeof promocion.valor === 'string' 
      ? parseFloat(promocion.valor) 
      : promocion.valor
    
    if (isNaN(valor)) {
      errores.push({
        campo: 'valor',
        mensaje: 'El valor debe ser un número válido',
      })
    } else if (valor <= 0) {
      errores.push({
        campo: 'valor',
        mensaje: 'El valor debe ser mayor a 0',
      })
    } else if (promocion.tipo === 'porcentaje' && valor > 100) {
      errores.push({
        campo: 'valor',
        mensaje: 'El porcentaje no puede ser mayor a 100',
      })
    }
  } else if (esCreacion) {
    errores.push({
      campo: 'valor',
      mensaje: 'El valor de la promoción es obligatorio',
    })
  }

  // Validar fechas
  if (esCreacion || promocion.fechaInicio !== undefined || promocion.fechaFin !== undefined) {
    const fechaInicio = promocion.fechaInicio 
      ? new Date(promocion.fechaInicio) 
      : null
    const fechaFin = promocion.fechaFin 
      ? new Date(promocion.fechaFin) 
      : null

    if (esCreacion && !fechaInicio) {
      errores.push({
        campo: 'fechaInicio',
        mensaje: 'La fecha de inicio es obligatoria',
      })
    } else if (fechaInicio && isNaN(fechaInicio.getTime())) {
      errores.push({
        campo: 'fechaInicio',
        mensaje: 'La fecha de inicio no es válida',
      })
    }

    if (esCreacion && !fechaFin) {
      errores.push({
        campo: 'fechaFin',
        mensaje: 'La fecha de fin es obligatoria',
      })
    } else if (fechaFin && isNaN(fechaFin.getTime())) {
      errores.push({
        campo: 'fechaFin',
        mensaje: 'La fecha de fin no es válida',
      })
    }

    // Validar que fin sea posterior a inicio
    if (fechaInicio && fechaFin && fechaFin <= fechaInicio) {
      errores.push({
        campo: 'fechaFin',
        mensaje: 'La fecha de fin debe ser posterior a la de inicio',
      })
    }
  }

  // Validar aplicaA
  if (esCreacion || promocion.aplicaA !== undefined) {
    const aplicaValidos = ['categoria', 'producto', 'todos']
    if (!promocion.aplicaA || !aplicaValidos.includes(promocion.aplicaA)) {
      errores.push({
        campo: 'aplicaA',
        mensaje: 'Debe indicar a qué aplica: "categoria", "producto" o "todos"',
      })
    }
  }

  return {
    esValido: errores.length === 0,
    errores,
  }
}

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

/**
 * Convierte una lista de errores de validación a un objeto.
 * Útil para mostrar errores en formularios.
 * @param errores - Lista de errores de validación
 * @returns Objeto con el campo como clave y el mensaje como valor
 */
export function erroresAObjeto(
  errores: ValidationError[]
): Record<string, string> {
  return errores.reduce((acc, error) => {
    acc[error.campo] = error.mensaje
    return acc
  }, {} as Record<string, string>)
}

/**
 * Valida que un valor no esté vacío.
 * @param valor - El valor a validar
 * @returns true si el valor tiene contenido
 */
export function noEstaVacio(valor: string | undefined | null): boolean {
  return valor !== undefined && valor !== null && valor.trim() !== ''
}

/**
 * Valida que un número esté en un rango.
 * @param valor - El número a validar
 * @param min - Valor mínimo permitido
 * @param max - Valor máximo permitido (opcional)
 * @returns true si el valor está en el rango
 */
export function estaEnRango(
  valor: number,
  min: number,
  max?: number
): boolean {
  if (max !== undefined) {
    return valor >= min && valor <= max
  }
  return valor >= min
}
