# QA y Hardening del flujo de pedidos

Repo: app-bodegas (Next.js App Router).

## Puntos de falla y defensas rápidas
- **Clave de carrito**: usar siempre `pedido:<bodegaId>` desde `lib/cartStorage.ts`; no reusar entre bodegas.
- **Hidratación de carrito**: en `app/bodegas/[bodegaId]/BodegaDetailClient.tsx` y `app/pedido/confirmar/ConfirmClient.tsx` leer localStorage antes de escribir; usar flag `hydrated` para evitar pisar con `[]`.
- **IDs de producto**: al hidratar, descartar IDs sin match en productos.csv; log warning. Opcional: limpiar entradas huérfanas.
- **Precios/cantidades**: totales con `precio_cop ?? 0`; cantidades mínimo 1.
- **Mínimo de pedido**: bloquear botón y POST cuando subtotal < mínimo; mostrar “Te faltan…”.
- **Query/bodega inválida**: en `app/pedido/confirmar/page.tsx` hacer `notFound()` si falta bodegaId o no existe en CSV.
- **API pedidos** (`app/api/pedidos/route.ts`): validar bodegaId string, items con `productoId`, `cantidad > 0` y `precio` válido; `datosEntrega` con nombre y dirección; estado default “nuevo”; total calculado en servidor; createdAt ISO; manejar JSON corrupto/ausente.
- **Archivo pedidos.json**: `lib/pedidos.ts` debe tolerar ENOENT/SyntaxError y devolver [].
- **params Promise**: en rutas dinámicas (ej. `app/pedidos/[pedidoId]/page.tsx`) resolver `params` con `await`.
- **Errores de FS/permisos**: capturar en API y devolver 500 con mensaje claro.
- **Cambio de bodega**: cada bodega mantiene su propio carrito; no compartir key.

## Checklist de QA manual
1) **Carrito base**
   - Ir a `/bodegas/BOD_001`, agregar 2 productos.
   - Panel “Mi pedido” muestra subtotal > 0; en dev, debug key `pedido:BOD_001` con JSON `{productoId,cantidad}`.
   - Abrir `/pedido/confirmar?bodegaId=BOD_001`; items y total coinciden; debug con misma key/raw.
2) **Mínimo de pedido**
   - Bajar cantidades bajo el mínimo: botón “Enviar pedido” deshabilitado y mensaje “Te faltan…”.
   - Subir cantidades sobre el mínimo: botón habilitado.
3) **Envío y limpieza**
   - Completar datos de entrega y enviar; ver mensaje de éxito y acceso a `/entregas/<pedidoId>`.
   - Confirmar que localStorage ya no tiene `pedido:BOD_001`.
4) **Listado y detalle**
   - Abrir `/bodega/BOD_001/pedidos`: el nuevo pedido aparece con fecha, pedidoId, bodegaId, total, estado “nuevo”.
   - Abrir `/entregas/<pedidoId>` con items (nombre, cantidad, precio, subtotal) y datosEntrega.
5) **Query/bodega inválida**
   - Abrir `/pedido/confirmar` sin query o con `bodegaId=BAD`: debe 404/notFound.
6) **Archivo corrupto (opcional)**
   - Corromper `data/pedidos.json`, abrir `/pedidos`: debe manejarse sin crash (lista vacía o error manejado), no 500 sin mensaje.
7) **Cambio de bodega**
   - Repetir flujo con `BOD_006`; verificar que no se mezcla con BOD_001 (cada una su key `pedido:<id>`).
