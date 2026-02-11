# Instrucciones para Agentes de IA en app-bodegas

## Resumen del Proyecto
Esta es una aplicación Next.js 16 para un sistema de pedidos en bodegas (almacenes). El MVP implementa un flujo simple: ver bodegas → ver productos → crear pedido.

## Arquitectura
- **Frontend**: Next.js App Router con React 19, TypeScript, Tailwind CSS
- **Almacenamiento de Datos**:
  - Datos estáticos: archivos CSV en `data/` (bodegas.csv, productos.csv)
  - Datos dinámicos: formato JSON Lines en `data/pedidos.jsonl` para logs de pedidos de solo anexión
- **API**: ruta `/api/pedidos` maneja creación de pedidos (POST) y listado (GET)
- **Dependencias**: `csv-parse` y `papaparse` para parsing de CSV, stack estándar de Next.js

## Patrones Clave
- **Parsing de Datos**: Usar función `safeNumber()` para conversión numérica robusta (maneja null/undefined)
- **IDs de Pedidos**: Generar con `crypto.randomUUID()` o fallback a IDs basados en timestamp
- **Almacenamiento de Archivos**: Asegurar que el directorio `data/` exista antes de escribir; usar JSONL para anexiones eficientes
- **Tipos**: Definir interfaces TypeScript para `Pedido`, `PedidoItem`, etc. en rutas API
- **Runtime**: Especificar `"nodejs"` runtime para rutas API que usan sistema de archivos

## Flujos de Trabajo
- **Desarrollo**: `npm run dev` inicia servidor de desarrollo
- **Construcción**: `npm run build` para construcción de producción
- **Linting**: `npm run lint` ejecuta ESLint
- **Acceso a Datos**: Parsear CSVs del lado cliente usando `papaparse` para datos de bodegas/productos

## Convenciones
- **Nomenclatura**: Términos en español (bodega, pedido, producto); moneda en COP
- **Contexto**: Mercado colombiano, incluye métodos de pago como Nequi, contraentrega
- **Gestión de Estado**: Sin librería de estado global; usar hooks de React para estado de componentes
- **Estilización**: Tailwind CSS con clases personalizadas; enfoque en diseño responsivo

## Ejemplos
- **Lectura de CSVs**: Usar `papaparse.parse()` con header:true para datos estructurados
- **Creación de Pedidos**: Validar `bodega_id` y array `items`; calcular totales del lado servidor
- **Manejo de Errores**: Retornar `{ok: false, error: string}` para fallos en API

## Estructura de Archivos
- `app/page.tsx`: Página de inicio con enlace a bodegas
- `app/api/pedidos/route.ts`: API de pedidos (ejemplifica patrón de almacenamiento JSONL)
- `data/`: Archivos CSV para datos estáticos, JSONL para pedidos</content>
<parameter name="filePath">c:\Users\loomb\OneDrive\Desktop\app\app-bodegas\.github\copilot-instructions.md