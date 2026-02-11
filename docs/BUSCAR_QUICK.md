# PRUEBAS RÁPIDAS - Motor de Búsqueda

**Servidor:** http://localhost:3000
**Documentación completa:** `docs/BUSCAR_VALIDACION.md`

---

## URLs DE PRUEBA DIRECTAS

### API (JSON Response)
```
/api/buscar?q=jabon
/api/buscar?q=agua&category=BEBIDAS
/api/buscar?q=detergente&bodegaId=BOD_001&sort=precio_asc
/api/buscar?minPrice=1000&maxPrice=5000
/api/buscar?q=aseo&limit=5&offset=0
```

### Búsqueda (Página Completa)
```
/buscar?q=aseo
/buscar?q=agua&category=BEBIDAS
/buscar?q=&sort=precio_desc&limit=10
```

### Búsqueda en Bodegas
```
/bodegas/BOD_001          ← Input "🔍 Buscar productos..."
/bodegas/BOD_009          ← Otra bodega
```

---

## CHECKLIST DE VALIDACIÓN (2 minutos)

- [ ] Abre `/api/buscar?q=jabon` → Devuelve JSON con items
- [ ] Abre `/buscar?q=aseo` → Muestra resultados en grid
- [ ] Escribe "detergente" en `/buscar` → Filtra en tiempo real (debounce)
- [ ] Selecciona categoría en `/buscar` → Se filtra y URL cambia
- [ ] Click "Ver en bodega" → Va a `/bodegas/[id]`
- [ ] Abre `/bodegas/BOD_001` → Input de búsqueda funciona
- [ ] Click "👁️ Ver" en bodega → Abre modal con detalles
- [ ] Click "+Agregar" en modal → Agrega al carrito sin cerrar búsqueda
- [ ] Recarga página con parámetros → Mantiene búsqueda

---

## ESTRUCTURA DE RESPUESTA API

```json
{
  "ok": true,
  "q": "jabon",
  "total": 10,
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
    }
  ],
  "facets": {
    "categorias": ["ASEO"],
    "bodegas": [{"id": "BOD_001", "nombre": "Bodega Central"}],
    "zonas": ["Centro"]
  }
}
```

---

## ARCHIVOS MODIFICADOS

- `app/api/buscar/route.ts` → API endpoint
- `app/buscar/BuscarClient.tsx` → Debounce, filtros, URL sync
- `app/bodegas/[bodegaId]/BodegaDetailClient.tsx` → Búsqueda local + modal
- `components/ProductQuickModal.tsx` → Detalles rápidos
- `docs/BUSCAR.md` → Documentación completa
- `docs/BUSCAR_VALIDACION.md` → Pruebas exhaustivas

---

## SOPORTE OFFLINE

Si quieres probar sin internet:
1. Los datos están en `data/productos.csv` y `data/bodegas.csv`
2. Se cargan en tiempo de compilación (no hay DB remota)
3. API devuelve datos locales siempre

---

## NEXT (MVP Completado)

El motor de búsqueda está **100% funcional**. Si necesitas:
- Más filtros → Edita `/api/buscar` y agrega parámetros
- Cambiar UI → Edita `BuscarClient.tsx` (categorías, cards, etc)
- Agregar sugerencias → Implementa autocomplete con useEffect

¡Listo para producción!
