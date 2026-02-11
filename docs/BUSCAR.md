# Motor de Búsqueda - Pruebas Manuales

## Estado: MVP FUNCIONAL

**Fecha:** Febrero 7, 2026
**Servidor:** http://localhost:3001

---

## AUDITORÍA COMPLETADA

### Componentes verificados:
- ✅ **API:** `/api/buscar` (route.ts) → Devuelve `{ ok, q, total, items, facets, limit, offset }`
- ✅ **Datos:** `productos.csv` + `bodegas.csv` → Se leen correctamente
- ✅ **UI:** `/buscar` page → Conectada a API con debounce (300ms)
- ✅ **Modal:** ProductQuickModal.tsx → Disponible en /bodegas/[id] (no afecta búsqueda)

### Parámetros soportados en `/api/buscar`:
```
GET /api/buscar?q=...&category=...&bodegaId=...&zona=...&minPrice=...&maxPrice=...&sort=...&limit=50&offset=0
```

**Parámetros:**
- `q`: String (búsqueda por nombre/categoría, case-insensitive, "contains")
- `category`: Filtro por categoría exacta (ej: "ASEO")
- `bodegaId`: Filtro por bodega exacta (ej: "BOD_001")
- `zona`: Filtro por zona (ej: "Centro")
- `minPrice`, `maxPrice`: Rango de precio en COP
- `sort`: "relevancia" | "precio_asc" | "precio_desc" (default: "relevancia")
- `limit`: 1-500 (default: 50)
- `offset`: Paginación (default: 0)

### Respuesta API (ejemplo):
```json
{
  "ok": true,
  "q": "jabón",
  "total": 15,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "productId": "PRD_BOD_001_0002",
      "nombre": "Jabón Rey 300g",
      "categoria": "ASEO",
      "precio": 2800,
      "stock": 500,
      "bodegaId": "BOD_001",
      "bodegaNombre": "Bodega Central",
      "ciudad": "Bogotá",
      "zona": "Centro"
    },
    ...
  ],
  "facets": {
    "categorias": ["ASEO", "BEBIDAS", ...],
    "bodegas": [{ "id": "BOD_001", "nombre": "Bodega Central" }, ...],
    "zonas": ["Centro", "Norte", ...]
  }
}
```

---

## PRUEBAS MANUALES (Obligatorias)

### 1. **Búsqueda básica por término**
```
http://localhost:3001/buscar?q=jabón
```
**Esperado:** Lista de productos con "jabón" en el nombre o categoría. Ordenados por relevancia.

---

### 2. **Búsqueda con filtro de categoría**
```
http://localhost:3001/buscar?q=agua&category=BEBIDAS
```
**Esperado:** Solo productos de categoría "BEBIDAS" que contengan "agua". Total < búsqueda sin filtro.

---

### 3. **Búsqueda con filtro de bodega**
```
http://localhost:3001/buscar?q=detergente&bodegaId=BOD_001
```
**Esperado:** Solo productos de bodega BOD_001 que contengan "detergente".

---

### 4. **Búsqueda con rango de precio**
```
http://localhost:3001/buscar?q=&minPrice=1000&maxPrice=5000
```
**Esperado:** Todos los productos entre $1.000 y $5.000. Campo `q` vacío pero devuelve resultados.

---

### 5. **Búsqueda ordenada por precio (menor primero)**
```
http://localhost:3001/buscar?q=aseo&sort=precio_asc
```
**Esperado:** Resultados de "aseo" ordenados por precio ascendente.

---

### 6. **Búsqueda ordenada por precio (mayor primero)**
```
http://localhost:3001/buscar?q=bebidas&sort=precio_desc
```
**Esperado:** Resultados de "bebidas" ordenados por precio descendente.

---

### 7. **Paginación (offset + limit)**
```
http://localhost:3001/buscar?q=aseo&limit=10&offset=0
```
luego
```
http://localhost:3001/buscar?q=aseo&limit=10&offset=10
```
**Esperado:** Primera URL muestra primeros 10, segunda URL muestra siguientes 10 (diferentes resultados).

---

### 8. **Búsqueda vacía (sin q)**
```
http://localhost:3001/buscar
```
**Esperado:** "Buscando..." inicialmente, luego vacío (sin q, no busca).

---

### 9. **Búsqueda sin resultados**
```
http://localhost:3001/buscar?q=zzzzzzzzzzz
```
**Esperado:** "Sin resultados" message.

---

### 10. **API directa (sin UI)**
```
http://localhost:3001/api/buscar?q=agua&sort=relevancia&limit=5
```
**Esperado:** JSON con max 5 items.

---

### 11. **Búsqueda en bodega (integración)**
Entrar a: `http://localhost:3001/bodegas/BOD_001`
Usar el campo **"🔍 Buscar productos..."** en la parte superior
Escribir: "detergente"
**Esperado:** Filtrar productos en tiempo real, categorías tabs funcionales, modal "Ver" abre detalles.

---

## CHECKLIST DE VALIDACIÓN

- [ ] Búsqueda devuelve resultados reales (no placeholders)
- [ ] Filtros funcionan (categoría, bodega, zona, precio)
- [ ] Ordenamiento funciona (relevancia, precio_asc, precio_desc)
- [ ] Debounce 300ms funciona (no spam de requests)
- [ ] Modal ProductQuickModal abre sin bloquear búsqueda
- [ ] URL se sincroniza con parámetros de búsqueda
- [ ] Paginación funciona (offset + limit)
- [ ] Respuesta API es consistente (ok, items, facets, meta)
- [ ] Sin errores en consola browser
- [ ] Sin errores en terminal server

---

## SIGUIENTES PASOS (NO INCLUIDOS EN ESTE MVP)

- [ ] Búsqueda por voz
- [ ] Historial reciente
- [ ] Búsquedas guardadas/favoritos
- [ ] Autocomplete en el input
- [ ] Filtros avanzados (más campos)
- [ ] Exportar resultados (CSV/PDF)
- [ ] Analytics de búsquedas

---

## NOTAS

- El modal ProductQuickModal.tsx es solo para detalles rápidos en `/bodegas/[id]`, no interfiere con búsqueda.
- La búsqueda en `/buscar` y en `/bodegas/[id]` son independientes pero usan la misma lógica de filtrado.
- Los datos se leen en tiempo de build desde CSVs; no hay base de datos real.
