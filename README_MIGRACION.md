# 📚 Guía de Migración a Prisma - App Bodegas

Esta guía explica cómo completar la migración de archivos JSON a PostgreSQL usando Prisma.

## 📋 Requisitos Previos

1. **Node.js** versión 18 o superior
2. **Base de datos PostgreSQL** (recomendado: [Neon](https://neon.tech/))
3. **Variables de entorno** configuradas

## 🔧 Configuración Inicial

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con tu URL de base de datos:

```env
# URL de conexión a PostgreSQL (Neon)
DATABASE_URL="postgresql://usuario:password@host/database?sslmode=require"
```

> ⚠️ **Importante**: Nunca subas el archivo `.env` a Git. Ya está incluido en `.gitignore`.

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Generar Cliente de Prisma

```bash
npx prisma generate
```

## 🗄️ Migración de Base de Datos

### Paso 4: Crear las Tablas

Ejecuta las migraciones para crear las tablas en tu base de datos:

```bash
npx prisma migrate dev --name agregar_productos_promociones
```

Este comando:
- ✅ Crea las tablas `Producto`, `Promocion` y `Pedido` (si no existen)
- ✅ Aplica los índices definidos en el schema
- ✅ Genera el cliente de Prisma actualizado

### Paso 5: Verificar el Schema (Opcional)

Para ver el estado actual de tu base de datos:

```bash
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes:
- Ver las tablas creadas
- Explorar los datos
- Agregar/editar registros manualmente

## 📦 Migrar Datos de JSON a PostgreSQL

### Paso 6: Ejecutar Script de Migración

El script lee los archivos JSON en `/data` y los inserta en PostgreSQL:

```bash
npx tsx scripts/migrar-datos.ts
```

Alternativamente:

```bash
npx ts-node scripts/migrar-datos.ts
```

### ¿Qué hace el script?

1. Lee `data/productos.json` → Inserta en tabla `Producto`
2. Lee `data/promociones.json` → Inserta en tabla `Promocion`
3. Usa **upsert** (crear o actualizar) para evitar duplicados
4. Muestra un resumen de registros migrados

## ✅ Verificar la Migración

### Probar la API

Una vez completada la migración, verifica que los endpoints funcionen:

```bash
# Iniciar servidor de desarrollo
npm run dev

# Probar endpoints (en otra terminal)
curl http://localhost:3000/api/productos?bodegaId=BOD_006
curl http://localhost:3000/api/promociones?bodegaId=BOD_006
```

### Respuestas Esperadas

**Productos:**
```json
{
  "success": true,
  "data": [...productos...],
  "total": 5
}
```

**Promociones:**
```json
{
  "success": true,
  "data": [...promociones...],
  "total": 3,
  "activas": 1
}
```

## 🆘 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"

Ejecuta:
```bash
npx prisma generate
```

### Error: "Connection refused" o "Database does not exist"

1. Verifica que tu `DATABASE_URL` sea correcta
2. Asegúrate de que la base de datos exista en Neon
3. Verifica que no haya espacios extra en la URL

### Error: "Relation does not exist"

Las tablas no se han creado. Ejecuta:
```bash
npx prisma migrate dev
```

### Los datos no aparecen en la aplicación

1. Ejecuta el script de migración: `npx tsx scripts/migrar-datos.ts`
2. Verifica con Prisma Studio: `npx prisma studio`

## 📁 Estructura de Archivos Relevantes

```
app-bodegas/
├── prisma/
│   ├── schema.prisma      # Definición de modelos de BD
│   └── migrations/        # Historial de migraciones
├── lib/
│   └── prisma.ts          # Cliente Prisma (singleton)
├── app/api/
│   ├── productos/route.ts # API de productos (usa Prisma)
│   └── promociones/route.ts # API de promociones (usa Prisma)
├── scripts/
│   └── migrar-datos.ts    # Script de migración JSON → PostgreSQL
├── data/
│   ├── productos.json     # Datos de productos (fuente)
│   └── promociones.json   # Datos de promociones (fuente)
└── .env                   # Variables de entorno (NO subir a Git)
```

## 📝 Comandos Útiles de Prisma

| Comando | Descripción |
|---------|-------------|
| `npx prisma generate` | Genera el cliente de Prisma |
| `npx prisma migrate dev` | Aplica migraciones pendientes |
| `npx prisma migrate reset` | Resetea la BD y aplica todas las migraciones |
| `npx prisma studio` | Abre la interfaz visual de BD |
| `npx prisma db push` | Sincroniza schema sin crear migración |
| `npx prisma format` | Formatea el archivo schema.prisma |

## 🚀 Próximos Pasos

Una vez completada la migración:

1. ✅ Verifica que los endpoints funcionen correctamente
2. ✅ Prueba crear nuevos productos y promociones desde la UI
3. ✅ Considera agregar más datos de prueba para otras bodegas
4. ✅ Elimina los archivos JSON si ya no los necesitas (opcional)

---

**¿Problemas?** Revisa los logs del servidor (`npm run dev`) para identificar errores específicos.
