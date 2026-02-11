# Sistema de Carga de Productos por Bodega

## Resumen
Sistema completo para que los administradores de bodegas carguen productos de forma masiva mediante:
- **CSV/XLSX**: Carga en lote desde archivos Excel o CSV
- **Foto**: Carga individual con fotografía y extracción automática de datos via IA (opcional)

## Ubicación
`/bodega/cargar-productos` - Página protegida solo para bodegueros

## Características

### Tab 1: Carga CSV/XLSX
- **Upload**: Seleccionar archivo `.csv` o `.xlsx`
- **Detección automática**: Identifica columnas clave (nombre, categoría, precio, stock)
- **Mapeo de columnas**: Reasignar columnas si los nombres no coinciden
- **Preview**: Tabla interactiva antes de guardar
- **Validación**: Verifica campos obligatorios y formatos
- **Guardado**: Upsert (actualiza si existe, inserta si es nuevo)

### Tab 2: Carga por Foto
- **Upload de imagen**: PNG, JPG, JPEG
- **Extracción IA** (opcional): Extrae automáticamente nombre, categoría, precio, stock
- **Entrada manual**: Formulario para completar datos si IA no está disponible
- **Preview**: Revisa antes de guardar
- **Guardado**: Inserta nuevo producto

## Estructura de Datos

### Formato CSV esperado (mínimos requeridos)
```
producto_id,bodega_id,nombre,categoria,precio_cop,stock,unidad,imagen_url,puntos_base,activo
PRD_BOD_001_0001,BOD_001,Arroz Blanco,Granos,5000,100,kg,,10,TRUE
```

### Campos obligatorios
- `nombre`: Nombre del producto (máx 100 caracteres)
- `categoria`: Categoría (ej: "Granos", "Lácteos")
- `precio_cop`: Precio en COP (debe ser número > 0)
- `stock`: Cantidad en inventario (número ≥ 0)

### Campos opcionales
- `unidad`: Unidad de medida (default: "unidad")
- `imagen_url`: URL de la imagen
- `puntos_base`: Puntos de lealtad (default: 0)
- `activo`: TRUE/FALSE (default: TRUE)

## Lógica de Upsert

Al guardar productos:

1. **Carga CSV**: 
   - Si existe producto con mismo (nombre + categoría + bodega_id) → **SKIP** (no duplica)
   - Si es nuevo → Genera `producto_id` con formato `PRD_{bodegaId}_{NNNN}` → Inserta

2. **Carga Foto**:
   - Siempre inserta (no verifica duplicados)
   - Genera `producto_id` automático

## APIs Utilizadas

### POST `/api/bodega/parse-file`
Parsea archivos CSV/XLSX y retorna array de objetos.

**Request**:
```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]); // .csv o .xlsx
const response = await fetch("/api/bodega/parse-file", { method: "POST", body: formData });
```

**Response**:
```json
{
  "ok": true,
  "rows": [{"nombre": "Arroz", "precio": "5000"}, ...],
  "columns": ["nombre", "precio", "stock"],
  "count": 15
}
```

### POST `/api/bodega/importar-productos`
Guarda productos en `data/productos.csv`.

**Request**:
```javascript
const response = await fetch("/api/bodega/importar-productos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    bodegaId: "BOD_001",
    productos: [
      { nombre: "Arroz", categoria: "Granos", precio_cop: 5000, stock: 100 }
    ]
  })
});
```

**Response**:
```json
{
  "ok": true,
  "imported": 5,
  "updated": 0,
  "message": "Se importaron 5 productos exitosamente"
}
```

### POST `/api/ia/extraer-productos` (Opcional)
Extrae información de productos desde una foto usando OpenAI Vision.

**Request**:
```javascript
const response = await fetch("/api/ia/extraer-productos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  })
});
```

**Response**:
```json
{
  "ok": true,
  "productos": [
    { "nombre": "Arroz Blanco", "categoria": "Granos", "precio_cop": 5000, "stock": 1 }
  ],
  "count": 1
}
```

Si `OPENAI_API_KEY` no está configurada, retorna 501 con mensaje de fallback.

## Configuración

### Requerimientos
- Archivo `data/productos.csv` debe existir con encabezados
- Librerías: `csv-parse` (ya incluida en package.json)

### IA Opcional
Para usar extracción de datos desde foto:

1. **Agregar OPENAI_API_KEY** a `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ```

2. Si no está configurada, la UI muestra opción de entrada manual automáticamente

## Validaciones

### En el formulario CSV
- ✓ Archivo debe ser `.csv` o `.xlsx`
- ✓ Nombre (obligatorio, máx 100 chars)
- ✓ Categoría (obligatoria)
- ✓ Precio (obligatorio, número > 0)
- ✓ Stock (obligatorio, número ≥ 0)

### En la API
- Valida bodegaId existente
- Valida array no vacío
- Valida formato de cada producto
- Retorna detalles de errores

## Pruebas Manuales

### Test 1: Carga CSV básica
**Objetivo**: Importar productos desde archivo CSV

**Pasos**:
1. Navegar a `/bodega/cargar-productos`
2. Tab "Subir CSV/Excel"
3. Crear archivo `test.csv`:
   ```csv
   nombre,categoria,precio_cop,stock
   Arroz Blanco,Granos,5000,100
   Frijoles,Granos,8000,50
   ```
4. Seleccionar archivo
5. Hacer clic en "Ver Preview"
6. Verificar que se muestren 2 productos
7. Clic "Guardar productos"
8. Mensaje "Se importaron 2 productos"
9. Redirecciona a `/bodega/productos`
10. Verificar que los 2 productos aparecen en la lista

**Esperado**: ✓ Productos aparecen en listado y son buscables en `/buscar`

---

### Test 2: Mapeo automático de columnas
**Objetivo**: Verificar que el sistema detecta y mapea columnas automáticamente

**Pasos**:
1. Crear archivo con nombres diferentes:
   ```csv
   item,tipo,valor_cop,cantidad
   Leche,Lácteos,3000,200
   Queso,Lácteos,12000,50
   ```
2. Upload del archivo
3. En preview, debe mostrar automáticamente mapeado:
   - `item` → nombre
   - `tipo` → categoría
   - `valor_cop` → precio
   - `cantidad` → stock
4. Verificar datos correctos en tabla
5. Guardar

**Esperado**: ✓ Auto-detección funciona, datos se guardan correctamente

---

### Test 3: Validación de campos obligatorios
**Objetivo**: Verificar que rechaza datos incompletos

**Pasos**:
1. Crear archivo incompleto:
   ```csv
   nombre,categoria
   Arroz,Granos
   ```
2. Upload
3. Preview debe mostrar campos faltantes: precio, stock
4. Intentar guardar
5. Mostrar error "Faltan campos obligatorios: precio_cop, stock"
6. No permite guardar hasta completar

**Esperado**: ✓ Validación previene importación incompleta

---

### Test 4: Edición en preview y guardar cambios
**Objetivo**: Verificar que los cambios en preview se guardan correctamente

**Pasos**:
1. Cargar CSV con 2 productos
2. En tabla preview, editar uno:
   - Cambiar precio de 5000 → 6000
   - Cambiar stock de 100 → 80
3. Verificar cambios en tabla (sin enviar aún)
4. Clic "Guardar productos"
5. Ir a `/bodega/productos`
6. Verificar que el producto muestra precio=6000, stock=80

**Esperado**: ✓ Cambios en preview se persistieron

---

### Test 5: Búsqueda de productos importados
**Objetivo**: Verificar que productos importados son buscables

**Pasos**:
1. Importar 5 productos con nombres distintos
2. Navegar a `/buscar`
3. Buscar por nombre de cada producto importado
4. Cada búsqueda debe retornar el producto correspondiente
5. Verificar que bodega_id coincide con la de login

**Esperado**: ✓ Todos los productos importados aparecen en búsqueda

---

### Test 6: Carga de foto (sin IA)
**Objetivo**: Verificar flujo de carga por foto sin extracción IA

**Pasos**:
1. Tab "Subir Foto"
2. Subir imagen de producto
3. Formulario manual aparece:
   - Nombre
   - Categoría
   - Precio
   - Stock
4. Completar datos manualmente
5. Preview muestra el producto
6. Clic "Guardar"
7. Confirmar en listado de productos

**Esperado**: ✓ Producto se guarda correctamente

---

### Test 7: Carga de foto con IA (opcional)
**Objetivo**: Verificar extracción automática de datos (requiere OPENAI_API_KEY)

**Pasos** (solo si OPENAI_API_KEY está configurada):
1. Tab "Subir Foto"
2. Foto de producto (ej: caja de arroz)
3. Mensaje "Extrayendo información..." aparece
4. Sistema extrae automáticamente:
   - Nombre: "Arroz Blanco" (del texto visible)
   - Categoría: "Granos" (inferido)
   - Precio: número detectado en imagen
   - Stock: 1 (default si no se detecta)
5. Usuario puede editar antes de guardar
6. Guardar

**Esperado**: ✓ IA extrae correctamente o fallback a manual

---

### Test 8: Duplicidad - No duplicar en carga CSV
**Objetivo**: Verificar que no inserta duplicados

**Pasos**:
1. Importar producto: "Arroz Blanco", "Granos", 5000, 100
2. Importar mismo producto nuevamente
3. Ir a `/bodega/productos`
4. Buscar "Arroz Blanco"
5. Debe aparecer solo 1 resultado (no 2)

**Esperado**: ✓ Sistema detecta duplicado y no inserta

---

### Test 9: XLSX support
**Objetivo**: Verificar que acepta archivos Excel

**Pasos**:
1. Crear archivo `productos.xlsx` con columnas: nombre, categoría, precio_cop, stock
2. Agregar 3-5 productos
3. Upload en tab CSV
4. Preview debe mostrar todos los datos correctamente
5. Guardar

**Esperado**: ✓ XLSX se parsea correctamente

---

### Test 10: Navegación posterior
**Objetivo**: Verificar que después de importar, usuario puede navegar sin errores

**Pasos**:
1. Importar 5 productos
2. Después del mensaje de éxito, redireccionar a `/bodega/productos`
3. Clic en un producto para ver detalles
4. Volver atrás
5. Navegar a `/buscar`, buscar los productos
6. Clic en resultado para ver bodega

**Esperado**: ✓ Todas las navegaciones funcionan sin errores

## Troubleshooting

### Error: "No se puede leer el archivo"
- Verificar que el archivo no esté abierto en Excel
- Intentar guardar como CSV UTF-8 desde Excel
- Probar con archivo pequeño primero (< 10 productos)

### Error: "Faltan campos obligatorios"
- Verificar que las columnas: nombre, categoría, precio_cop, stock existen
- Si tienes nombres diferentes, usar mapeo manual en preview

### IA no extrae datos
- Verificar que `OPENAI_API_KEY` está en `.env.local`
- Foto debe ser clara y mostrar etiqueta del producto
- Fallback a entrada manual siempre está disponible

### Productos no aparecen en búsqueda
- Esperar ~30 segundos después de importar (caché)
- Verificar bodega_id coincide
- Ir a `/bodega/productos` para confirmar que fueron importados

## Notas de Implementación

### Archivos creados
- `app/bodega/cargar-productos/page.tsx` - Página SSR
- `app/bodega/cargar-productos/CargarProductosClient.tsx` - Componente cliente
- `app/api/bodega/parse-file/route.ts` - Parsea CSV/XLSX
- `app/api/bodega/importar-productos/route.ts` - Guarda en data/productos.csv
- `app/api/ia/extraer-productos/route.ts` - Extrae datos de foto

### Cambios a archivos existentes
- `lib/csv.ts` - Agregó función `appendProducto()`

### Ningún cambio breaking
- Sistema es completamente aditivo
- No modifica flujos existentes
- Compatible con bodegas.csv y búsqueda

## Limitaciones Conocidas

1. **No hay UPDATE en CSV**: Actualmente, si subes duplicado, se ignora. Para actualizar precio/stock, hay que editar manualmente o usar `/bodega/productos`
2. **Foto IA**: Solo extrae categoría básica (ej: "Granos"). Para categorías complejas, usar manualmente
3. **Limite de archivo**: CSV/XLSX máximo 5000 productos por carga recomendada

## Futuras Mejoras

- [ ] Implementar UPDATE en CSV (reescritura de archivo)
- [ ] Agregar importación de categorías desde header
- [ ] Permitir agregar imagen URL en carga foto
- [ ] Historial de importaciones
- [ ] Validación de SKU duplicado globalmente
- [ ] Exportar productos a CSV
