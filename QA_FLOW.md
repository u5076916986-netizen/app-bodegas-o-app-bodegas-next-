# QA Rápido: Simulación de Flujo y Fallos

Checklist ejecutable para validar la salud de la aplicación.

## 1. Inicio: Listado de Bodegas
**URL:** `/bodegas`

| Estado | Qué debería verse | Qué puede fallar | Cómo detectarlo | Verificación rápida |
|---|---|---|---|---|
| **OK** | Lista de cards (blancas/pro), TopNav, footer. | Error de lectura CSV. | Pantalla de error Next.js o lista vacía. | Revisar `data/bodegas.csv` existe. |
| **OK** | Estilos cargados (Tailwind). | FOUC o sin estilos. | Layout roto, texto plano. | `npm run dev` o build CSS. |

## 2. Selección y Carrito
**URL:** `/bodegas/BOD_001`

| Estado | Qué debería verse | Qué puede fallar | Cómo detectarlo | Verificación rápida |
|---|---|---|---|---|
| **OK** | Header bodega, lista productos, panel "Mi pedido". | `bodegaId` no existe. | 404 Not Found. | URL correcta vs CSV. |
| **OK** | Agregar producto suma al subtotal. | Hidratación fallida. | Carrito se borra al recargar (F5). | Ver `localStorage` key `pedido:BOD_001`. |
| **OK** | Precios formateados (COP). | Precios NaN/Null. | "NaN" o "$0" en total. | Revisar `precio_cop` en CSV. |

## 3. Confirmación de Pedido
**URL:** `/pedido/confirmar?bodegaId=BOD_001`

| Estado | Qué debería verse | Qué puede fallar | Cómo detectarlo | Verificación rápida |
|---|---|---|---|---|
| **OK** | Resumen items, inputs entrega, total final. | `module-not-found`. | Error rojo en consola/pantalla. | Revisar imports (`@/components/...`). |
| **OK** | Botón "Enviar" habilitado si cumple mínimo. | Total < Mínimo. | Botón gris, aviso "Te faltan $X". | Agregar más productos. |
| **OK** | Formulario valida campos vacíos. | Envío sin datos. | Click no hace nada o alerta HTML5. | Llenar nombre/tel/dir. |
| **OK** | Persistencia al recargar. | Carrito vacío tras F5. | "No hay productos". | Revisar `useEffect` de hidratación. |

## 4. Envío (API)
**Acción:** Click en "Enviar pedido"

| Estado | Qué debería verse | Qué puede fallar | Cómo detectarlo | Verificación rápida |
|---|---|---|---|---|
| **OK** | Spinner "Enviando...", luego redirección. | Error 500 (FS write). | Toast/Texto "Error al enviar". | Permisos en carpeta `data/`. |
| **OK** | Limpieza de carrito. | Carrito sigue lleno. | Items siguen en resumen tras éxito. | Revisar `localStorage.removeItem`. |
| **OK** | Creación de ID pedido. | ID undefined/null. | URL `/pedidos/undefined`. | Revisar respuesta API `/api/pedidos`. |

## 5. Historial y Detalle
**URL:** `/pedidos` y `/pedidos/[pedidoId]`

| Estado | Qué debería verse | Qué puede fallar | Cómo detectarlo | Verificación rápida |
|---|---|---|---|---|
| **OK** | Tabla con nuevo pedido (estado: recibido). | JSON corrupto. | Tabla vacía o crash 500. | Validar sintaxis `data/pedidos.json`. |
| **OK** | Detalle muestra items y dirección. | `params` Promise warning. | Consola: "params should be awaited". | Usar `await params` en `page.tsx`. |
| **OK** | Botón "Volver". | 404 en ID válido. | Página 404. | Verificar ID en URL vs JSON. |

---

## Comandos útiles
- **Ver logs:** `docker compose logs -f web` o consola de terminal.
- **Limpiar data (reset):** Borrar contenido de `data/pedidos.json` (dejar `[]`).
- **Ver localStorage:** F12 -> Application -> Local Storage.
