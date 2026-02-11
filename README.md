# app-bodegas

Aplicación Next.js para sistema de pedidos en bodegas (almacenes). El MVP implementa un flujo simple: ver bodegas → ver productos → crear pedido.

## 🔍 Motor de Búsqueda (NUEVO)

✅ **Motor de búsqueda en tiempo real completamente funcional**

- API endpoint: `/api/buscar?q=...&category=...&bodegaId=...`
- UI en página `/buscar` con filtros, debounce, URL sync
- Integrado en `/bodegas/[id]` con tabs y modal
- Soporta: categoría, bodega, zona, precio, ordenamiento
- Documentación: Ver `BUSCAR_STATUS.md` y `docs/BUSCAR*.md`

**Prueba rápido:**
```bash
http://localhost:3000/buscar?q=jabon
http://localhost:3000/api/buscar?q=agua&sort=precio_asc
http://localhost:3000/bodegas/BOD_001  # Input búsqueda en parte superior
```

## Arquitectura

- **Frontend**: Next.js App Router con React 19, TypeScript, Tailwind CSS
- **Almacenamiento de datos**:
  - Datos estáticos: archivos CSV en `data/` (bodegas.csv, productos.csv)
  - Datos dinámicos: formato JSON Lines en `data/pedidos.jsonl` para logs de pedidos de solo anexión
- **API**: ruta `/api/pedidos` maneja creación de pedidos (POST) y listado (GET)
- **Dependencias**: `csv-parse` y `papaparse` para parsing de CSV, stack estándar de Next.js

## Flujos de desarrollo

- **Desarrollo**: `npm run dev` inicia el servidor de desarrollo
- **Construcción**: `npm run build` para construcción de producción
- **Inicio**: `npm run start` para iniciar en producción
- **Linting**: `npm run lint` ejecuta ESLint

## Convenciones del proyecto

- **Nomenclatura**: términos en español (bodega, pedido, producto); moneda en COP
- **Contexto**: mercado colombiano, incluye métodos de pago como Nequi, contraentrega
- **Gestión de estado**: sin librería de estado global; usar hooks de React para estado de componentes
- **Estilización**: Tailwind CSS con clases personalizadas; enfoque en diseño responsivo

## Estructura de archivos

- `app/page.tsx`: página de inicio con enlace a bodegas
- `app/api/pedidos/route.ts`: API de pedidos (ejemplifica patrón de almacenamiento JSONL)
- `data/`: archivos CSV para datos estáticos, JSONL para pedidos
