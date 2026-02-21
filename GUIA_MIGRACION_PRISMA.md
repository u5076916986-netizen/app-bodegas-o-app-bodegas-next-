# 🚀 Guía de Migración: JSON a Prisma/PostgreSQL

## Índice
1. [Resumen](#resumen)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso 1: Configurar la Base de Datos](#paso-1-configurar-la-base-de-datos)
4. [Paso 2: Ejecutar Migraciones de Prisma](#paso-2-ejecutar-migraciones-de-prisma)
5. [Paso 3: Generar el Cliente Prisma](#paso-3-generar-el-cliente-prisma)
6. [Paso 4: Migrar los Datos](#paso-4-migrar-los-datos)
7. [Paso 5: Probar la Aplicación](#paso-5-probar-la-aplicación)
8. [Prompts para Copilot](#prompts-para-copilot)
9. [Troubleshooting](#troubleshooting)

---

## Resumen

Esta guía te ayudará a migrar tu aplicación de archivos JSON a una base de datos PostgreSQL usando Prisma. 

**¿Qué cambió?**
- Antes: Los datos se guardaban en archivos `.json` en la carpeta `data/`
- Después: Los datos se guardan en PostgreSQL (Neon) y se acceden con Prisma

**Archivos modificados/creados:**
- `prisma/schema.prisma` - Define las tablas de la base de datos
- `lib/prisma.ts` - Configuración del cliente Prisma
- `app/api/productos/route.ts` - API actualizada para usar Prisma
- `app/api/promociones/route.ts` - API actualizada para usar Prisma
- `scripts/migrar-datos.ts` - Script para migrar datos existentes

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

✅ Node.js 18+ instalado  
✅ Una base de datos PostgreSQL (Neon)  
✅ El archivo `.env` con tu `DATABASE_URL`  

**Verifica tu DATABASE_URL en `.env`:**
```bash
# El archivo .env debe tener algo como:
DATABASE_URL="postgresql://usuario:contraseña@host/basedatos?sslmode=require"
```

---

## Paso 1: Configurar la Base de Datos

### 1.1 Verificar la conexión

Primero, verifica que tu `DATABASE_URL` sea correcta:

```bash
# En la terminal, ejecuta:
npx prisma db pull
```

Si ves errores de conexión, revisa tu URL en Neon Dashboard.

### 1.2 Si no tienes el archivo .env

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Crea el archivo
touch .env

# Edítalo y agrega tu DATABASE_URL
```

---

## Paso 2: Ejecutar Migraciones de Prisma

Las migraciones crean las tablas en tu base de datos basándose en `schema.prisma`.

### 2.1 Crear la migración

```bash
npx prisma migrate dev --name agregar_productos_promociones
```

**¿Qué hace este comando?**
- Lee tu `schema.prisma`
- Compara con la base de datos actual
- Genera archivos SQL de migración
- Ejecuta los cambios en la base de datos

### 2.2 Verificar que las tablas se crearon

```bash
npx prisma studio
```

Esto abre una interfaz web donde puedes ver tus tablas.

---

## Paso 3: Generar el Cliente Prisma

El cliente Prisma es el código que te permite interactuar con la base de datos.

```bash
npx prisma generate
```

**¿Qué hace este comando?**
- Lee tu `schema.prisma`
- Genera código TypeScript con tipos para tus modelos
- Lo guarda en `node_modules/@prisma/client`

**IMPORTANTE:** Ejecuta este comando cada vez que modifiques `schema.prisma`.

---

## Paso 4: Migrar los Datos

Ahora vamos a mover los datos de los archivos JSON a PostgreSQL.

### 4.1 Instalar ts-node o tsx (si no lo tienes)

```bash
# Opción 1: Usar tsx (recomendado)
npm install -D tsx

# Opción 2: Usar ts-node
npm install -D ts-node
```

### 4.2 Ejecutar el script de migración

```bash
# Con tsx
npx tsx scripts/migrar-datos.ts

# O con ts-node
npx ts-node scripts/migrar-datos.ts
```

### 4.3 Verificar la migración

Deberías ver algo como:

```
************************************************************
*  SCRIPT DE MIGRACIÓN - App Bodegas                       *
*  Migrando datos de JSON a PostgreSQL                     *
************************************************************

🔗 Conectando a la base de datos...
   ✅ Conexión exitosa

============================================================
📦 MIGRANDO PRODUCTOS
============================================================
📂 Leyendo archivo: data/productos.json
   ✅ 5 registros encontrados
   ✅ Arroz Premium 5kg (PROD_001)
   ✅ Frijoles Negros 2kg (PROD_002)
   ...

============================================================
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
============================================================
```

---

## Paso 5: Probar la Aplicación

### 5.1 Iniciar el servidor de desarrollo

```bash
npm run dev
```

### 5.2 Probar los endpoints

Abre tu navegador y prueba:

**Productos:**
```
http://localhost:3000/api/productos?bodegaId=BOD_006
```

**Promociones:**
```
http://localhost:3000/api/promociones?bodegaId=BOD_006
```

### 5.3 Verificar en Prisma Studio

```bash
npx prisma studio
```

---

## Prompts para Copilot

Aquí tienes prompts específicos en español que puedes usar con GitHub Copilot para tareas comunes:

### Para agregar un nuevo campo a un modelo:

```
// Copilot: Agrega un campo "imagenUrl" de tipo String opcional al modelo Producto
// El campo debe almacenar la URL de la imagen del producto
```

### Para crear un nuevo endpoint:

```
// Copilot: Crea un endpoint PUT para actualizar un producto existente
// Debe recibir el ID del producto en la URL y los campos a actualizar en el body
// Usa Prisma para la actualización
// Incluye validación de campos y manejo de errores
// Agrega comentarios explicativos en español
```

### Para agregar filtros a una consulta:

```
// Copilot: Modifica el GET de productos para filtrar por:
// - categoria (opcional)
// - precioMinimo (opcional)
// - precioMaximo (opcional)
// - activo (opcional, default true)
// Usa Prisma con where condicional
```

### Para crear una relación entre modelos:

```
// Copilot: Crea una relación entre Producto y Promocion
// Un producto puede tener múltiples promociones
// Una promoción puede aplicar a múltiples productos
// Necesito una tabla intermedia PromocionProducto
```

### Para agregar paginación:

```
// Copilot: Agrega paginación al endpoint de productos
// Parámetros: page (default 1), limit (default 20)
// Respuesta: { data, total, page, totalPages }
// Usa Prisma skip y take
```

### Para agregar búsqueda:

```
// Copilot: Agrega búsqueda por nombre al endpoint de productos
// Parámetro: search (busca en nombre y descripcion)
// Usa Prisma contains con mode insensitive
```

---

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solución:**
```bash
npx prisma generate
```

### Error: "Invalid `prisma.producto.findMany()` invocation"

**Causa:** El cliente Prisma no está sincronizado con el schema.

**Solución:**
```bash
npx prisma generate
# Reinicia el servidor de desarrollo
npm run dev
```

### Error: "P2002: Unique constraint failed"

**Causa:** Estás intentando crear un registro con un ID que ya existe.

**Solución:** 
- Verifica que no haya duplicados en tus datos JSON
- El script usa `upsert`, así que puedes ejecutarlo múltiples veces sin problema

### Error: "Connection refused" o "ECONNREFUSED"

**Causa:** No hay conexión a la base de datos.

**Solución:**
1. Verifica tu `DATABASE_URL` en `.env`
2. Asegúrate de que Neon esté activo (no en pausa)
3. Verifica que la IP esté permitida en Neon

### Error: "Modelo no existe en el schema"

**Causa:** Modificaste el schema pero no generaste el cliente.

**Solución:**
```bash
npx prisma migrate dev --name nombre_cambio
npx prisma generate
```

### Los datos no aparecen en la aplicación

**Verificación paso a paso:**

1. **Verifica la migración:**
   ```bash
   npx prisma studio
   ```
   Revisa que las tablas tengan datos.

2. **Verifica el bodegaId:**
   Asegúrate de que estás consultando el bodegaId correcto.

3. **Revisa la consola del servidor:**
   ```bash
   npm run dev
   ```
   Busca errores en rojo.

4. **Prueba el endpoint directamente:**
   ```
   http://localhost:3000/api/productos?bodegaId=BOD_006
   ```

### Cómo reiniciar la base de datos desde cero

⚠️ **CUIDADO: Esto borra todos los datos**

```bash
# Elimina todas las migraciones y datos
npx prisma migrate reset

# Vuelve a migrar los datos
npx tsx scripts/migrar-datos.ts
```

---

## Comandos Útiles de Prisma

```bash
# Ver estado de migraciones
npx prisma migrate status

# Abrir interfaz visual de la BD
npx prisma studio

# Regenerar cliente después de cambios
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name descripcion_cambio

# Sincronizar schema con BD existente (sin migración)
npx prisma db push

# Obtener schema de BD existente
npx prisma db pull
```

---

## ¿Necesitas Ayuda?

Si tienes problemas:

1. **Revisa los logs:** La mayoría de errores se explican en la consola
2. **Usa Prisma Studio:** `npx prisma studio` para ver los datos reales
3. **Verifica el .env:** El 80% de los problemas son de conexión

¡Éxito con tu migración! 🎉
