// =============================================================================
// COMPONENTE: PromocionForm
// =============================================================================
// Formulario para crear y editar promociones.
// Incluye validación del lado del cliente y diseño responsive.
//
// Props:
//   - initialValues: Valores iniciales para edición (opcional)
//   - onSubmit: Función que recibe los valores del formulario
//   - onCancel: Función para cancelar y cerrar el formulario
//   - isLoading: Estado de carga (deshabilita el formulario)
//   - categorias: Lista de categorías disponibles para seleccionar
// =============================================================================

"use client"

import { useMemo, useState } from "react"

// Tipos de datos para la promoción
export interface PromocionFormValues {
  nombre: string
  tipo: "porcentaje" | "monto_fijo"
  valor: number
  fechaInicio: string  // Formato: YYYY-MM-DD
  fechaFin: string     // Formato: YYYY-MM-DD
  aplicaA: "categoria" | "producto" | "todos"
  categoriaProductos: string[]
}

interface PromocionFormProps {
  initialValues?: Partial<{
    id: string
    nombre: string
    tipo: "porcentaje" | "monto_fijo" | string
    valor: number
    fechaInicio: string | Date
    fechaFin: string | Date
    aplicaA: "categoria" | "producto" | "todos" | string
    categoriaProductos?: string[]
  }>
  onSubmit: (values: PromocionFormValues) => void
  onCancel: () => void
  isLoading?: boolean
  categorias?: string[]  // Lista de categorías disponibles
}

export default function PromocionForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  categorias = [],
}: PromocionFormProps) {
  // Función para formatear fecha a YYYY-MM-DD
  const formatearFecha = (fecha: string | Date | undefined): string => {
    if (!fecha) return ""
    const date = new Date(fecha)
    return date.toISOString().split("T")[0]
  }

  // Estado del formulario
  const [values, setValues] = useState<PromocionFormValues>({
    nombre: initialValues?.nombre ?? "",
    tipo: (initialValues?.tipo as "porcentaje" | "monto_fijo") ?? "porcentaje",
    valor: initialValues?.valor ?? 0,
    fechaInicio: formatearFecha(initialValues?.fechaInicio) || "",
    fechaFin: formatearFecha(initialValues?.fechaFin) || "",
    aplicaA: (initialValues?.aplicaA as "categoria" | "producto" | "todos") ?? "todos",
    categoriaProductos: initialValues?.categoriaProductos ?? [],
  })

  // Campos que han sido tocados (para mostrar errores)
  const [touched, setTouched] = useState({
    nombre: false,
    valor: false,
    fechaInicio: false,
    fechaFin: false,
  })

  // Validación de campos
  const errors = useMemo(() => {
    const next: Record<string, string> = {}

    // Nombre obligatorio
    if (!values.nombre.trim()) {
      next.nombre = "El nombre de la promoción es obligatorio"
    } else if (values.nombre.length < 3) {
      next.nombre = "El nombre debe tener al menos 3 caracteres"
    }

    // Valor debe ser positivo
    if (values.valor <= 0) {
      next.valor = "El valor debe ser mayor a 0"
    }
    // Si es porcentaje, no puede ser mayor a 100
    if (values.tipo === "porcentaje" && values.valor > 100) {
      next.valor = "El porcentaje no puede ser mayor a 100"
    }

    // Fechas obligatorias
    if (!values.fechaInicio) {
      next.fechaInicio = "La fecha de inicio es obligatoria"
    }
    if (!values.fechaFin) {
      next.fechaFin = "La fecha de fin es obligatoria"
    }

    // Fecha fin debe ser posterior a fecha inicio
    if (values.fechaInicio && values.fechaFin) {
      const inicio = new Date(values.fechaInicio)
      const fin = new Date(values.fechaFin)
      if (fin <= inicio) {
        next.fechaFin = "La fecha de fin debe ser posterior a la de inicio"
      }
    }

    return next
  }, [values])

  // Verificar si el formulario es válido
  const isValid = Object.keys(errors).length === 0

  // Manejar envío del formulario
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Marcar todos los campos como tocados
    setTouched({
      nombre: true,
      valor: true,
      fechaInicio: true,
      fechaFin: true,
    })

    // No enviar si hay errores
    if (!isValid) return

    onSubmit(values)
  }

  // Manejar cambio de categorías seleccionadas
  const handleCategoriaChange = (categoria: string, checked: boolean) => {
    if (checked) {
      setValues({
        ...values,
        categoriaProductos: [...values.categoriaProductos, categoria],
      })
    } else {
      setValues({
        ...values,
        categoriaProductos: values.categoriaProductos.filter((c) => c !== categoria),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo: Nombre */}
      <div>
        <label
          htmlFor="promo-nombre"
          className="block text-sm font-medium text-slate-700"
        >
          Nombre de la promoción
        </label>
        <input
          id="promo-nombre"
          type="text"
          value={values.nombre}
          onChange={(e) => setValues({ ...values, nombre: e.target.value })}
          onBlur={() => setTouched({ ...touched, nombre: true })}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Descuento de verano"
          disabled={isLoading}
        />
        {touched.nombre && errors.nombre && (
          <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
        )}
      </div>

      {/* Campo: Tipo y Valor (en la misma fila) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="promo-tipo"
            className="block text-sm font-medium text-slate-700"
          >
            Tipo de descuento
          </label>
          <select
            id="promo-tipo"
            value={values.tipo}
            onChange={(e) =>
              setValues({
                ...values,
                tipo: e.target.value as "porcentaje" | "monto_fijo",
              })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto_fijo">Monto fijo ($)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="promo-valor"
            className="block text-sm font-medium text-slate-700"
          >
            Valor {values.tipo === "porcentaje" ? "(%)" : "($)"}
          </label>
          <input
            id="promo-valor"
            type="number"
            min={0}
            max={values.tipo === "porcentaje" ? 100 : undefined}
            value={values.valor}
            onChange={(e) =>
              setValues({ ...values, valor: Number(e.target.value) })
            }
            onBlur={() => setTouched({ ...touched, valor: true })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {touched.valor && errors.valor && (
            <p className="mt-1 text-xs text-red-600">{errors.valor}</p>
          )}
        </div>
      </div>

      {/* Campo: Fechas (en la misma fila) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="promo-fecha-inicio"
            className="block text-sm font-medium text-slate-700"
          >
            Fecha de inicio
          </label>
          <input
            id="promo-fecha-inicio"
            type="date"
            value={values.fechaInicio}
            onChange={(e) =>
              setValues({ ...values, fechaInicio: e.target.value })
            }
            onBlur={() => setTouched({ ...touched, fechaInicio: true })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {touched.fechaInicio && errors.fechaInicio && (
            <p className="mt-1 text-xs text-red-600">{errors.fechaInicio}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="promo-fecha-fin"
            className="block text-sm font-medium text-slate-700"
          >
            Fecha de fin
          </label>
          <input
            id="promo-fecha-fin"
            type="date"
            value={values.fechaFin}
            onChange={(e) => setValues({ ...values, fechaFin: e.target.value })}
            onBlur={() => setTouched({ ...touched, fechaFin: true })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {touched.fechaFin && errors.fechaFin && (
            <p className="mt-1 text-xs text-red-600">{errors.fechaFin}</p>
          )}
        </div>
      </div>

      {/* Campo: Aplica a */}
      <div>
        <label
          htmlFor="promo-aplica"
          className="block text-sm font-medium text-slate-700"
        >
          Aplica a
        </label>
        <select
          id="promo-aplica"
          value={values.aplicaA}
          onChange={(e) =>
            setValues({
              ...values,
              aplicaA: e.target.value as "categoria" | "producto" | "todos",
            })
          }
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="todos">Todos los productos</option>
          <option value="categoria">Categorías específicas</option>
          <option value="producto">Productos específicos</option>
        </select>
      </div>

      {/* Selector de categorías (solo si aplica a categorías) */}
      {values.aplicaA === "categoria" && categorias.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Seleccionar categorías
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categorias.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 rounded border border-slate-200 p-2 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.categoriaProductos.includes(cat)}
                  onChange={(e) => handleCategoriaChange(cat, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si aplica a productos específicos */}
      {values.aplicaA === "producto" && (
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            💡 Puedes seleccionar productos específicos después de crear la
            promoción desde la vista de productos.
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Guardando...
            </>
          ) : (
            "Guardar promoción"
          )}
        </button>
      </div>
    </form>
  )
}
