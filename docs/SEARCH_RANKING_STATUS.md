# Search Ranking / Sinónimos / Did-You-Mean - Status

Checklist de validación para feature de ranking inteligente, sinónimos y typo correction.

## Validación Obligatoria

1) Buscar "jabon" y "jabón" da lo mismo (normalización)
- [ ] Escribe "jabon" → resultado es el mismo que "jabón"

2) Buscar "mecato" encuentra productos en SNACKS
- [ ] Escribe "mecato" → encuentra productos aunque no diga "mecato" (sinónimos)

3) Buscar "detergnte" (mal escrito) muestra "¿Quisiste decir detergente?"
- [ ] Escribe "detergnte" → aparece sugerencia "detergente" (Levenshtein)

4) Resultados más relevantes arriba
- [ ] Exact match sube (buscar "Jabón Azul" coloca "Jabón Azul" arriba)
- [ ] Stock alto sube (productos con stock > 100 suben en tie-breakers)
- [ ] Sin query: empty query muestra historial + tendencias

5) Sort respeta ranking pero preserva filtro
- [ ] sort=precio_asc: ordena por precio pero mantiene score como secondary

6) No rompe build, no añade librerías
- [ ] npm run build compila sin errores

## Archivos Modificados/Creados

- data/sinonimos.json (nuevo)
- app/api/buscar/route.ts (completamente refactorizado)
- app/buscar/BuscarClient.tsx (agregado didYouMean banner)
- components/SearchDropdown.tsx (agregado didYouMean suggestions)
- lib/useSearchSuggest.ts (agregado didYouMean state)
- components/TopNav.tsx (pasando didYouMean a dropdown)

## Lógica de Scoring

```
score = 0

// Exact match full query
if (normalizedQuery in nombre) → +10

// Token-based scoring
for each token:
  if token in nombre:
    +4 base
    if nombre.startsWith(token): +2
  if token in categoria: +1

// Stock bonus (tie-breaker)
if stock > 100: +3
else if stock > 50: +2
else if stock > 0: +1

// Sorting: relevancia (by score, then stock)
```

## Sinónimos (MVP)

Diccionario en data/sinonimos.json:
- "aseo" → ["limpieza", "detergente", "jabón", "jabon", ...]
- "bebidas" → ["gaseosa", "refresco", "soda", "jugo", ...]
- "snacks" → ["mecato", "pasabocas", "papas", ...]
- etc.

Expansion: query tokens se expanden con sinónimos si coinciden. Max 8 tokens finales.

## Did-You-Mean (Typo Correction)

Levenshtein distance simple (O(nm) DP):
- Se activa si resultados == 0 || resultados < 3
- Evalúa top 200 candidatos (nombres productos + categorías)
- Threshold:
  - distancia <= 2 si query <= 5 chars
  - distancia <= 3 si query > 5 chars
- Devuelve max 3 sugerencias

Response shape:
```json
{
  "ok": true,
  "q": "...",
  "items": [...],
  "meta": {
    "expandedTokens": ["token1", "token2"],
    "didYouMean": ["suggestion1", "suggestion2"]
  }
}
```

## URLs Ejemplo

### Normalización (tildes)
```
GET /api/buscar?q=jabon
GET /api/buscar?q=jabón
```
Mismos resultados.

### Sinónimos
```
GET /api/buscar?q=mecato
```
Encuentra productos de SNACKS.

### Did-You-Mean (typo)
```
GET /api/buscar?q=detergnte
```
Response incluye `didYouMean: ["detergente"]`

### Búsqueda UI con banner
```
http://localhost:3000/buscar?q=detergnte
```
Muestra banner amarillo: "¿Quisiste decir: detergente?"

### Autocomplete con Did-You-Mean
```
TopNav input: escribe "jabonx" (mal)
Dropdown muestra sugerencia "jabon" en sección "¿Quisiste decir:"
```

## Notas

- Sin librerías externas (Levenshtein escrito a mano).
- Normalización: acentos removidos, lowercase, espacios normalizados.
- Performance: máx 200 candidatos evaluados para did-you-mean.
- Backward compatible: parámetros existentes (sort, category, bodegaId) funcionan igual.
