# Deploy de app-bodegas a Vercel

## Requisitos previos
- Cuenta en GitHub y Vercel.
- Node 18+ localmente (para pruebas `npm run dev` y `npm run build`).

## Estado del proyecto
- Next.js 16 (App Router) con TypeScript.
- Lectura de CSVs desde `data/` (solo lectura, funciona en Vercel).
- Pedidos:
  - Modo archivo (local): guarda en `data/pedidos.json`.
  - Modo demo (Vercel): usa memoria (no persistente) cuando `ORDERS_STORAGE=memory`.

## Pasos de publicación
1) Subir el repo a GitHub (sin incluir `.env.local` ni secretos).
2) En Vercel, **Import Project** desde GitHub.
3) Settings principales:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output: `.next`
4) Variables de entorno (Project Settings → Environment Variables):
   - `ORDERS_STORAGE=memory` (recomendada en Vercel para usar modo demo en memoria).
   - No subas llaves sensibles (no se usan aquí por defecto).
5) Deploy: Vercel hará el build y dará una URL `https://<app>.vercel.app/`.

## Verificación post-deploy
- Abrir `/bodegas`: debe cargar listado y mostrar “Entorno: produccion | Pedidos: demo (memoria)” si `ORDERS_STORAGE=memory`.
- Flujo de prueba:
  1) `/bodegas/BOD_001` agregar productos, confirmar pedido.
  2) `/pedido/confirmar?bodegaId=BOD_001` completar datos, enviar.
  3) `/pedidos` y `/pedidos/<pedidoId>` deben reflejar el pedido (en modo memoria se pierde si el proceso reinicia).

## Notas
- En Vercel serverless el filesystem es de solo lectura; por eso `ORDERS_STORAGE=memory` evita escrituras a disco. Para persistencia real, usar un servicio externo (KV, base de datos).
- En local (desarrollo), omite `ORDERS_STORAGE` para usar archivo `data/pedidos.json`.
