# Autocomplete / Suggestions MVP - Status

Checklist to validate the feature according to requirements:

1) Escribo “ja” → aparecen productos “jabón…” y bodegas relacionadas (si hay)
- [ ]

2) Enter en input → me lleva a /buscar?q=ja
- [ ]

3) Click en sugerencia → navega correcto (producto → bodega highlight / bodega → /bodegas/[id] / categoría → /buscar)
- [ ]

4) Se guarda historial (máximo 8) y se puede borrar
- [ ]

5) Si input vacío → muestra Historial + Tendencias
- [ ]

6) Teclado ↑ ↓ Enter funciona en dropdown
- [ ]

Files changed/added:
- lib/useSearchSuggest.ts
- lib/searchHistory.ts
- components/SearchDropdown.tsx
- components/TopNav.tsx (modified)
- app/bodegas/[bodegaId]/BodegaDetailClient.tsx (modified: highlight handling)

Notes:
- History and trends are persisted in `localStorage` scoped by role.
- The dropdown opens for queries >= 2 chars; empty query shows history + trends.
