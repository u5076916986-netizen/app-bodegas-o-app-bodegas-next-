# Implementación: Productos por Bodega

## Estado Actual
✅ **Completado sin errores**

## Cambios Realizados

### 1. Data Source: `data/productos.json`
- **Ubicación**: `data/productos.json`
- **Estructura**:
  - Array JSON con productos que incluyen `bodegaId`
  - Columnas: `id`, `bodegaId`, `nombre`, `sku`, `categoria`, `precio`, `stock`, `activo`, `descripcion`, `updatedAt`
  - **5 productos para BOD_002** (Arroz, Frijoles, Aceite, Sal, Harina)
  - **2 productos para BOD_003** (Queso, Leche) - para demostrar multi-bodega

### 2. API Routes: `/api/productos/route.ts`
```
GET  /api/productos?bodegaId=BOD_002  → lista productos filtrados
POST /api/productos                   → crear producto
PUT  /api/productos                   → editar producto
DELETE /api/productos?id=PROD_001     → eliminar producto
```

**Features**:
- Lectura/escritura en `data/productos.json`
- Filtrado automático por `bodegaId`
- Validación de campos requeridos
- Respuestas en formato `{ ok: boolean, data?, error?, meta? }`
- **Runtime**: `nodejs` (necesario para fs.promises)

**Ejemplo GET**:
```json
GET /api/productos?bodegaId=BOD_002
Response: {
  "ok": true,
  "data": [
    {
      "id": "PROD_001",
      "bodegaId": "BOD_002",
      "nombre": "Arroz Blanco 5kg",
      "sku": "ARR-001",
      "categoria": "Granos",
      "precio": 18500,
      "stock": 45,
      "activo": true,
      "updatedAt": "2026-02-08T10:00:00Z"
    },
    ...
  ],
  "meta": {
    "total": 5,
    "sinStock": 1
  }
}
```

### 3. UI: `/app/bodega/productos/page.tsx`
**Cambios**:
- ✅ Ahora es un componente **"use client"** con estado
- ✅ Carga productos del API via `fetch(/api/productos?bodegaId=...)`
- ✅ **Búsqueda**: por nombre o SKU (en tiempo real)
- ✅ **Filtros**:
  - Estado: Todos, Activo, Inactivo
  - Categoría: dinámico desde datos cargados
- ✅ **Tabla**:
  - Foto (avatar), Nombre, SKU, Categoría, Precio (formatado), Stock (con indicador "SIN STOCK"), Estado
  - Acciones por fila: Editar, Activar/Desactivar, Duplicar, Eliminar
- ✅ **Modal**: "Nuevo producto" y "Editar producto"
- ✅ **Contadores**:
  - Muestra "X productos • Y sin stock"
  - Se actualizan después de cada operación
- ✅ **Estados**:
  - Loading: "Cargando productos..."
  - Error: Muestra mensaje de error en banner rojo
  - Empty: "No hay productos que coincidan"
- ✅ **Peticiones POST/PUT/DELETE**: integradas, refrescan lista automáticamente

### 4. Componente ProductForm: `/components/ProductForm.tsx`
**Cambios**:
- ✅ Actualizado tipo de `initialValues` para no depender de `@/lib/mock/products`
- ✅ Mantiene accesibilidad: todos los inputs con `<label htmlFor>` e `id` único
- ✅ Validación de campos (nombre, sku, precio >= 0, stock >= 0)
- ✅ Soporta edición y creación

### 5. Layout Fix: `/app/bodega/[bodegaId]/(panel)/layout.tsx`
**Cambio**:
- ✅ Params ahora son `Promise<{ bodegaId: string }>` (Next.js 16 requirement)
- ✅ Componente es `async`
- ✅ Funciona correctamente con TypeScript

## Rutas Disponibles

### Para BOD_002:
```
GET  /bodega/BOD_002/productos
GET  /bodega/productos (redirige a BOD_002)
```

### Para otras bodegas:
```
GET  /bodega/BOD_003/productos
GET  /bodega/[anyId]/productos
```

## Testing Manual

### Listar productos de BOD_002:
```bash
curl "http://localhost:3000/api/productos?bodegaId=BOD_002"
```

### Crear producto:
```bash
curl -X POST "http://localhost:3000/api/productos" \
  -H "Content-Type: application/json" \
  -d '{
    "bodegaId": "BOD_002",
    "nombre": "Leche Descremada 1L",
    "sku": "LEC-002",
    "categoria": "Lácteos",
    "precio": 4900,
    "stock": 50,
    "activo": true,
    "descripcion": "Leche descremada fresca"
  }'
```

### Editar producto:
```bash
curl -X PUT "http://localhost:3000/api/productos" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PROD_001",
    "stock": 30
  }'
```

### Eliminar producto:
```bash
curl -X DELETE "http://localhost:3000/api/productos?id=PROD_001"
```

## Características de Accesibilidad ✅

- **Formulario**:
  - Todos los inputs tienen `<label>` con `htmlFor` coincidente
  - Mensajes de error explícitos
  - Botones con texto claro

- **Tabla**:
  - Headers descriptivos
  - Acciones con texto (no solo iconos)
  - Estados visuales claros (colores + texto)

- **Búsqueda**:
  - Label asociado al input
  - Placeholder descriptivo

## Notas Técnicas

1. **Persistencia**: JSON Lines vs CSV
   - ✅ **JSON elegido** porque permite writes parciales fácilmente
   - El archivo `data/productos.json` es completamente editable

2. **Multi-Bodega**:
   - Cada bodega ve solo sus productos
   - Parámetro `bodegaId` en tabla y modal garantiza aislamiento
   - Default: BOD_002 cuando no hay params

3. **Errores Conocidos**:
   - Advertencia de `baseline-browser-mapping` en build (pre-existente, sin impacto)
   - Error de `/tendero` (pre-existente, sin impacto en productos)

4. **Build**:
   - ✅ Compilación exitosa
   - ✅ 0 errores TypeScript
   - ✅ 37 rutas generadas (incluye 9 nuevas para /bodega/[bodegaId]/...)

## Próximos Pasos Opcionales

1. **Sincronización entre pestañas**: Usar BroadcastChannel API para actualizar cuando otro usuario edita
2. **Caché**: Implementar SWR o React Query para manejo inteligente de cache
3. **Imágenes**: Subida de fotos para los productos
4. **Bulk operations**: Importar/Exportar productos en CSV/Excel
5. **Auditoría**: Log de cambios (quién editó qué y cuándo)
