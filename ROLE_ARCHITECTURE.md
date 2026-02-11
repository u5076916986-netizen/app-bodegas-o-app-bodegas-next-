# Estructura de Roles - APP Bodegas

## Arquitectura de Rutas por Rol

### 1. ROL TENDERO
**Rutas principales:**
- `/tendero` (home) → Lista de Bodegas con command bar y filtros
- `/tendero/cupones` → Mis cupones disponibles
- `/pedidos` → Mis pedidos realizados

**Menú TopNav (TENDERO):**
- Logo: 🏪 APP Bodegas
- Links: Bodegas → `/tendero` | Mis Pedidos → `/pedidos`
- Secondary: 💳 Mis Cupones → `/tendero/cupones`
- Search: Búsqueda global de productos y bodegas

**Features:**
- Ver lista de bodegas disponibles
- Buscar por nombre, categoría, zona, ciudad
- Filtrar por ciudad, categoría, estado (activo)
- Ver cupones disponibles
- Gestionar pedidos

---

### 2. ROL BODEGA
**Rutas principales:**
- `/bodega` → Redirige a `/bodega/BOD_002/panel`
- `/bodega/[bodegaId]/panel` → Dashboard de bodega
- `/bodega/[bodegaId]/productos` → Inventario
- `/bodega/[bodegaId]/pedidos` → Pedidos recibidos
- `/bodega/[bodegaId]/promociones` → Gestión de promociones
- `/bodega/[bodegaId]/cupones` → Gestión de cupones
- `/bodega/[bodegaId]/inventario` → Inventario detallado
- `/bodega/[bodegaId]/logistica` → Gestión de entregas
- `/bodega/[bodegaId]/clientes` → Listado de clientes
- `/bodega/[bodegaId]/configuracion` → Configuración de bodega
- `/bodega/[bodegaId]/usuarios` → Gestión de usuarios
- `/bodega/ia` → Centro de IA

**Menú TopNav (BODEGA):**
- Logo: 🏪 APP Bodegas
- Links: Panel → `/bodega/BOD_002/panel` | Productos → `/bodega/BOD_002/productos` | Pedidos → `/bodega/BOD_002/pedidos`
- Secondary: 🎟️ Cupones → `/bodega/BOD_002/cupones`
- Search: Búsqueda global

**Features:**
- Dashboard con métricas clave
- Gestión de inventario
- Gestión de promociones (CRUD con tabs)
- Procesamiento de pedidos
- Gestión de cupones
- Logística y entregas

---

### 3. ROL REPARTIDOR
**Rutas principales:**
- `/repartidor` → Entregas de hoy (mock)
- `/repartidor/[id]` → Detalles de entrega

**Menú TopNav (REPARTIDOR):**
- Logo: 🏪 APP Bodegas
- Links: Entregas → `/repartidor`
- Search: Búsqueda global

**Features:**
- Ver entregas del día
- Actualizar estado de entregas
- Ver direcciones y detalles de pedidos

---

### 4. ROL ADMIN
**Rutas principales:**
- `/admin/ia` → Centro de IA (configuración global)

**Menú TopNav (ADMIN):**
- Logo: 🏪 APP Bodegas
- Links: Bodegas → `/tendero` | Admin IA → `/admin/ia`

---

## Redirecciones Implementadas

### /bodegas → /tendero
Cuando un usuario accede a `/bodegas`, es redirigido automáticamente a `/tendero`.
Este cambio mantiene compatibilidad con URLs antiguas.

```tsx
// app/bodegas/page.tsx
export default async function BodegasPageRedirect() {
  redirect("/tendero");
}
```

### /bodega → /bodega/BOD_002/panel
Cuando un usuario accede a `/bodega` sin bodegaId, es redirigido al panel de una bodega de ejemplo (BOD_002).

```tsx
// app/bodega/page.tsx
export default async function BodegaPageRedirect() {
  redirect("/bodega/BOD_002/panel");
}
```

---

## DevRoleSwitcher (Cambio de Rol)

El componente `DevRoleSwitcher` permite cambiar de rol en desarrollo y automáticamente redirige a la URL correcta.

**Comportamiento:**
1. Usuario selecciona un rol en el dropdown
2. Se llama a `setRole(newRole)` del `RoleProvider`
3. El rol se persiste en localStorage
4. Se ejecuta `router.replace(mapRoleToRoute(newRole))`

**Mapeo de redirecciones:**
```tsx
const mapRoleToRoute = (role: Role) => {
  return {
    tendero: "/tendero",
    bodega: "/bodega/BOD_002/panel",
    repartidor: "/repartidor",
    admin: "/admin/ia",
  }[role];
};
```

---

## RoleProvider (Contexto de Rol)

El `RoleProvider` maneja:
- Lectura/escritura de rol en localStorage (dev)
- Fallback a "tendero" por defecto
- Redirección automática al cambiar rol
- Contexto para consumir en componentes con `useRole()`

**Características:**
- SSR-safe: Lee localStorage solo en cliente
- Persist: Guarda rol en localStorage para la próxima visita
- Auto-redirect: Redirige automáticamente a la home del rol

---

## Topología de Layout

```
app/
├── layout.tsx (RootLayout)
│   ├── TopNav (global, pero con contenido dinámico por rol)
│   ├── RoleProvider (contexto global)
│   └── children
│
├── tendero/
│   ├── layout.tsx (TenderoLayout)
│   ├── page.tsx (home → lista de bodegas)
│   └── cupones/
│       └── page.tsx
│
├── bodega/
│   ├── layout.tsx (BodegaLayout)
│   ├── page.tsx (redirige a BOD_002/panel)
│   └── [bodegaId]/
│       ├── layout.tsx
│       ├── page.tsx (panel)
│       ├── panel/page.tsx
│       ├── productos/page.tsx
│       ├── pedidos/page.tsx
│       ├── promociones/page.tsx
│       ├── cupones/page.tsx
│       ├── inventario/page.tsx
│       ├── logistica/page.tsx
│       ├── clientes/page.tsx
│       ├── configuracion/page.tsx
│       └── usuarios/page.tsx
│
├── repartidor/
│   ├── layout.tsx (RepartidorLayout)
│   ├── page.tsx (entregas del día)
│   └── [id]/page.tsx (detalle de entrega)
│
└── bodegas/
    └── page.tsx (redirige a /tendero)
```

---

## Componentes Clave

### TopNav.tsx
Menú superior que:
- Muestra links diferentes según rol
- Tiene búsqueda global
- Integra con DevRoleSwitcher

### RoleProvider.tsx
Proveedor de contexto que:
- Maneja estado de rol
- Persiste en localStorage
- Hace redirect automático
- Proporciona `useRole()` hook

### DevRoleSwitcher.tsx
Selector de rol en desarrollo que:
- Cambia rol vía `setRole()`
- El setRole automáticamente redirige

---

## Flujo de Cambio de Rol

1. Usuario selecciona rol en DevRoleSwitcher
2. `handleChange` llama a `setRole(newRole)`
3. `setRole` en RoleProvider:
   - Guarda en localStorage
   - Actualiza estado local
   - Llama `router.replace(mapRoleToRoute(newRole))`
4. App navega a la URL del nuevo rol
5. TopNav se re-renderiza con links del nuevo rol
6. Usuario ve la home del nuevo rol

---

## Testing

Para verificar cada rol:

**Tendero:**
1. Abre DevRoleSwitcher
2. Selecciona "tendero"
3. Debe redirigir a `/tendero`
4. Debe ver lista de bodegas

**Bodega:**
1. Selecciona "bodega" en DevRoleSwitcher
2. Debe redirigir a `/bodega/BOD_002/panel`
3. Debe ver dashboard de bodega BOD_002

**Repartidor:**
1. Selecciona "repartidor" en DevRoleSwitcher
2. Debe redirigir a `/repartidor`
3. Debe ver entregas de hoy (mock)

**Admin:**
1. Selecciona "admin" en DevRoleSwitcher
2. Debe redirigir a `/admin/ia`
3. Debe ver configuración global de IA

---

## URLs Compatibles

- `/bodegas` → Automáticamente redirige a `/tendero`
- `/bodega` → Automáticamente redirige a `/bodega/BOD_002/panel`
- Todas las rutas antiguas de `/bodega/[bodegaId]/...` siguen funcionando
- Links en TopNav se actualizan automáticamente según rol actual
