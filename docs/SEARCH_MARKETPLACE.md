# Sistema de Búsqueda Marketplace - Documentación Completa

## Descripción General

Se ha implementado un sistema de búsqueda tipo marketplace (similar a Temu/AliExpress pero simplificado) con:

- **Página de búsqueda dedicada**: `/buscar` con interfaz de filtros y resultados
- **API mejorada**: `/api/buscar` soporta filtros reales, facets y paginación
- **Integración global**: TopNav con búsqueda rápida y historial
- **UX enriquecida**: Historial localStorage, "did-you-mean", búsqueda por categoría/bodega/zona

## Estructura de Archivos

### Frontend
- **[app/buscar/page.tsx](../app/buscar/page.tsx)** - Servidor: Página con metadatos, SSR props iniciales
- **[app/buscar/BuscarClient.tsx](../app/buscar/BuscarClient.tsx)** - Cliente: Estado, filtros, resultados, paginación
- **[components/TopNav.tsx](../components/TopNav.tsx)** - Barra superior con búsqueda global
- **[components/SearchBox.tsx](../components/SearchBox.tsx)** - Autocomplete con deduplicación y AbortController
- **[components/SearchDropdown.tsx](../components/SearchDropdown.tsx)** - Dropdown de sugerencias
- **[lib/searchHistory.ts](../lib/searchHistory.ts)** - Historial en localStorage por rol

### Backend
- **[app/api/buscar/route.ts](../app/api/buscar/route.ts)** - Endpoint con:
  - Ranking: exact match > partial match > token match
  - Sinónimos expandidos (ej: "cepillo" → "aseo", "limpieza")
  - Facets: categorías, bodegas, zonas de resultados
  - Paginación: offset + limit
  - Did-you-mean: sugerencias por Levenshtein distance
  - Deduplicación: por productId o bodegaId::productId

### Data
- **[data/productos.csv](../data/productos.csv)** - Productos (producto_id, bodega_id, nombre, categoria, precio_cop, stock...)
- **[data/bodegas.csv](../data/bodegas.csv)** - Bodegas (bodega_id, nombre, ciudad, zona...)
- **[data/sinonimos.json](../data/sinonimos.json)** - Mapeo de términos: aseo → {cepillo, escoba, jabon, ...}

---

## Flujos de Uso

### 1. Búsqueda desde TopNav (tendero)
```
Usuario escribe "jabon" en TopNav
  → SearchDropdown muestra autocomplete con sugerencias
  → Click en sugerencia → /bodegas/[bodegaId]?highlight=productId
  → O si presiona Enter → /buscar?q=jabon
```

### 2. Búsqueda Completa en /buscar
```
GET /buscar?q=jabon&category=ASEO&sort=precio_asc&page=1&limit=20
  → BuscarClient renderiza:
    - Sidebar con filtros: Categoría, Bodega, Zona, Precio, Stock, Orden
    - Grid de 20 resultados (o configurable)
    - Paginación si total > limit
  → Click en resultado → /bodegas/[bodegaId]
```

### 3. Filtros Dinámicos
```
Usuario:
  1. Selecciona "ASEO" en categoría → Recarga con ?category=ASEO
  2. Selecciona "BOD_001" en bodega → Añade &bodegaId=BOD_001
  3. Ordena por "precio_asc" → Cambia &sort=precio_asc
  4. Navega a página 2 → Suma &page=2
  → URL siempre refleja estado actual
  → Se puede compartir/bookmarkear
```

### 4. Historial de Búsqueda
```
localStorage:
  - search_history_queries:v1:{role} → ["jabon", "detergente", ...]
  - search_history_clicks:v1:{role} → [{kind, id, label, at}, ...]
  - search_trends_ctr:v1:{role} → {termino: count, ...}

Cuando SearchBox tiene q vacío:
  → Muestra últimas búsquedas + tendencias
  → Usuario puede hacer click → rellenar q y buscar
```

---

## Query Parameters de /buscar

| Param | Tipo | Default | Ejemplo |
|-------|------|---------|---------|
| `q` | string | "" | `jabon`, `detergente` |
| `category` | string | "" | `ASEO`, `BEBIDAS` |
| `bodegaId` | string | "" | `BOD_001` |
| `zona` | string | "" | `Centro`, `Norte` |
| `minPrice` | number | undefined | `1000` |
| `maxPrice` | number | undefined | `50000` |
| `sort` | enum | `relevancia` | `precio_asc`, `precio_desc` |
| `page` | number | `1` | `2`, `5` |
| `limit` | number | `20` | (fijo en BuscarClient) |

### Ejemplo completo:
```
/buscar?q=jabon&category=ASEO&bodegaId=BOD_001&minPrice=1000&maxPrice=10000&sort=precio_asc&page=1
```

---

## Respuesta del API /api/buscar

```json
{
  "ok": true,
  "q": "jabon",
  "page": 1,
  "limit": 20,
  "total": 45,
  "offset": 0,
  "items": [
    {
      "productId": "PRD_BOD_001_0002",
      "nombre": "Jabón Rey 300g",
      "categoria": "ASEO",
      "precio": 2800,
      "stock": 500,
      "bodegaId": "BOD_001",
      "bodegaNombre": "Bodega Centro",
      "ciudad": "Bogotá",
      "zona": "Centro",
      "score": 14,
      "matchHighlights": ["jabon"]
    },
    ...
  ],
  "facets": {
    "categorias": ["ASEO", "BEBIDAS"],
    "bodegas": [
      { "id": "BOD_001", "nombre": "Bodega Centro" },
      { "id": "BOD_002", "nombre": "Bodega Norte" }
    ],
    "zonas": ["Centro", "Norte", "Sur"]
  },
  "meta": {
    "expandedTokens": ["jabon", "aseo", "limpieza"],
    "didYouMean": ["jabon liquido"]
  }
}
```

---

## Lógica de Scoring en /api/buscar

```javascript
// Cada producto recibe score basado en:
score = 0

// 1. Exact full match en nombre
if (name.includes("jabon")) score += 10

// 2. Token-based matching
for (token of ["jabon"]) {
  if (name.includes(token)) {
    score += 4
    if (name.startsWith(token)) score += 2
  } else if (categoria.includes(token)) {
    score += 1  // category match
  }
}

// 3. Stock bonus (SOLO si hay match: score > 0)
if (score > 0) {
  if (stock > 100) score += 3
  else if (stock > 50) score += 2
  else if (stock > 0) score += 1
}

// 4. Zona bonus (si usuario filtró)
if (zona_filtro && bodega.zona === zona_filtro) score += 1

// Filtering: Si score === 0 y hay query → DESCARTA
if (allTokens.length > 0 && score === 0) continue

// Sorting: Por score DESC, luego stock DESC
```

---

## Sinónimos y Expansión

**Archivo**: [data/sinonimos.json](../data/sinonimos.json)

Cuando el usuario busca "cepillo":
1. Token = "cepillo"
2. Se busca en sinónimos: ¿"cepillo" está en valores de alguna clave?
3. Sí, "cepillo" está en valores de "aseo"
4. Se expande a: ["cepillo", "aseo", "limpieza", "detergente", "cloro", "jabon", "desinfectante", "escoba", "trapo", "bayeta"]
5. Se buscan productos que contengan CUALQUIERA de estos tokens
6. Si nada coincide con el nombre, se filtra por categoría (ASEO)

---

## Ejemplo de Flujos de Búsqueda

### Caso 1: Búsqueda simple "jabon"
```
GET /api/buscar?q=jabon&limit=20
```
- Busca productos con "jabon" en nombre
- Encontrados: Jabón Rey 300g (BOD_001), Jabón Rey 300g (BOD_002), Jabón líquido 500ml, ...
- Total: ~20 items
- Facets: ASEO, BEBIDAS, CARNES
- Muestra en grid de 3 columnas

### Caso 2: Búsqueda filtrada "detergente" solo en ASEO
```
GET /api/buscar?q=detergente&category=ASEO&sort=precio_asc
```
- Filtra por categoría ASEO primero
- Expande "detergente" a sinónimos de ASEO
- Ordena por precio ascendente
- Resultado: detergentes más baratos primero

### Caso 3: Búsqueda vacía (desde recientes)
```
GET /buscar?q=
```
- BuscarClient muestra:
  - Recientes búsquedas (del localStorage)
  - Sin resultados de API
  - Invita a escribir

### Caso 4: No hay resultados
```
GET /api/buscar?q=xyzabc123
```
- score === 0 para todo
- Respuesta: `{ items: [], total: 0, didYouMean: [] }`
- UI muestra: "No encontramos resultados para 'xyzabc123'"

---

## Tests Manuales

### Test 1: Búsqueda básica con buenos resultados
```
Ir a http://localhost:3000/buscar?q=jabon
Esperado:
  ✓ Muestra ~20 productos con "Jabón" en nombre
  ✓ Facets muestran al menos ASEO en categorías
  ✓ Click en resultado lleva a /bodegas/BOD_00X
```

### Test 2: Filtro por categoría
```
Ir a http://localhost:3000/buscar?q=jabon&category=ASEO
Esperado:
  ✓ Todos los resultados son de categoría ASEO
  ✓ Select "Categoría" muestra ASEO seleccionado
  ✓ Cambiar categoría recarga resultados
```

### Test 3: Ordenamiento por precio
```
Ir a http://localhost:3000/buscar?q=detergente&sort=precio_asc
Luego cambiar a: &sort=precio_desc
Esperado:
  ✓ Precio asc: productos más baratos primero
  ✓ Precio desc: productos más caros primero
  ✓ Select "Ordenar" refleja cambio
```

### Test 4: Paginación
```
Ir a http://localhost:3000/buscar?q=aseo
Esperado:
  ✓ Muestra primeros 20 resultados
  ✓ Botón "Siguiente" activo si total > 20
  ✓ Click en "Siguiente" va a page=2
  ✓ Mostrar "Página 1 de N"
```

### Test 5: Búsqueda desde TopNav
```
En http://localhost:3000/bodegas:
  1. Click en search input (TopNav)
  2. Escribir "cepillo"
  3. Debería mostrar dropdown con sugerencias
  4. Presionar Enter o click → /buscar?q=cepillo
Esperado:
  ✓ Autocomplete funciona
  ✓ Navigación a /buscar exitosa
  ✓ Resultados cargados
```

### Test 6: Búsqueda sin resultados
```
Ir a http://localhost:3000/buscar?q=xyzabc
Esperado:
  ✓ Muestra "No encontramos resultados para 'xyzabc'"
  ✓ Facets vacíos
  ✓ Sin botones de paginación
```

### Test 7: Historial de búsqueda (localStorage)
```
1. Buscar "jabon", "detergente", "pan"
2. Limpiar query (q=)
3. SearchDropdown debería mostrar recientes
Esperado:
  ✓ Últimas búsquedas aparecen en dropdown
  ✓ Click en reciente rellena q
```

---

## Cambios Implementados

### 1. SearchBox.tsx (Bug fix autocomplete)
- ✅ Agregado AbortController para cancela requests antiguas
- ✅ Deduplicación por productId
- ✅ Validación minLength < 2
- ✅ Cleanup en unmount

### 2. /api/buscar/route.ts (Scoring fix)
- ✅ Stock bonus SOLO si score > 0
- ✅ Categoría match suma 1 al score
- ✅ Deduplicación opcional por `seen` Set

### 3. data/sinonimos.json
- ✅ Agregado "cepillo" a valores de "aseo"

### 4. BuscarClient.tsx
- ✅ Soporta todos los params (q, category, bodegaId, zona, minPrice, maxPrice, sort, page)
- ✅ Sidebar con filtros reactivos
- ✅ Paginación con "Anterior/Siguiente"
- ✅ Grid responsive (1 col mobile, 2 col tablet, 3 col desktop)
- ✅ Rendering de facets dinámicos

### 5. TopNav.tsx
- ✅ SearchBox integrado (tendero)
- ✅ SearchDropdown con historial
- ✅ Links a /buscar en nav principal

---

## Uso Recomendado

### Para Tenderos (Comprador)
1. **Busca rápida** en TopNav
2. **Búsqueda completa** en /buscar con filtros
3. **Historial** automático en localStorage
4. **Did-you-mean** si no hay resultados

### Para Bodegas (Vendedor)
- Pueden ver sus productos en resultados de búsqueda
- Los productos se ranquean por relevancia + stock

### Para Admin
- Puede revisar /buscar con todos los parámetros
- API devuelve `meta.expandedTokens` para debugging

---

## Performance

- **API**: O(n) sobre todos los productos (en-memory parsing CSV)
- **Frontend**: Debounce 300ms en búsqueda
- **Facets**: Calculados sobre resultados (no todos los datos)
- **Storage**: localStorage máx ~10KB por rol (historial + trends)

---

## Extensiones Futuras

- [ ] Búsqueda por foto (IA)
- [ ] Filtro "En promoción"
- [ ] Historial de clics (analytics)
- [ ] Autocompletar por bodega
- [ ] Filtro rango de calificación
- [ ] Búsqueda guardada
- [ ] Buscar por SKU/código barras
