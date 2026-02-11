# Carga de Productos - Guía Rápida

## Acceso
- URL: `/bodega/cargar-productos`
- Solo visible para administradores de bodega

## Dos formas de cargar

### 1️⃣ CSV/Excel (Carga masiva)
```
1. Click "Subir CSV/Excel"
2. Selecciona archivo .csv o .xlsx
3. Preview muestra los datos
4. Edita si necesario
5. Click "Guardar productos"
```

**Soporta**: .csv, .xlsx  
**Rápido para**: 10-1000+ productos  
**Validación**: Detecta automáticamente: nombre, categoría, precio, stock

---

### 2️⃣ Foto + Datos (Carga individual)
```
1. Click "Subir Foto"
2. Selecciona imagen del producto
3. IA extrae datos (o entrada manual)
4. Completa nombre, categoría, precio, stock
5. Click "Guardar producto"
```

**Rápido para**: 1-5 productos  
**IA automática**: Si OPENAI_API_KEY configurada  
**Fallback**: Formulario manual siempre disponible

---

## Validación automática ✓

| Campo | Requerido | Validación |
|-------|-----------|-----------|
| Nombre | Sí | 1-100 caracteres |
| Categoría | Sí | No vacío |
| Precio | Sí | Número > 0 |
| Stock | Sí | Número ≥ 0 |

---

## Después de guardar

✅ Los productos aparecen en `/bodega/productos`  
✅ Son buscables en `/buscar` (para clientes)  
✅ Se pueden editar manualmente en `/bodega/productos`

---

## Si falla algo

| Problema | Solución |
|----------|----------|
| "Archivo no se lee" | Guardar como CSV UTF-8 desde Excel |
| "Faltan campos" | Incluir: nombre, categoría, precio_cop, stock |
| "IA no extrae" | Foto debe ser clara + OPENAI_API_KEY configurada |
| "Datos no aparecen" | Esperar 30s, refrescar página |

---

## Ejemplos

### CSV correcto
```csv
nombre,categoria,precio_cop,stock
Arroz Blanco,Granos,5000,100
Leche Entera,Lácteos,3500,200
```

### Excel (mismo formato)
| nombre | categoria | precio_cop | stock |
|--------|-----------|-----------|-------|
| Arroz Blanco | Granos | 5000 | 100 |
| Leche | Lácteos | 3500 | 200 |

---

## API Endpoints (dev)

- `POST /api/bodega/parse-file` - Parsea CSV/XLSX
- `POST /api/bodega/importar-productos` - Guarda productos
- `POST /api/ia/extraer-productos` - Extrae de foto (opcional)

---

## Más info
Ver `docs/IMPORT_PRODUCTOS.md` para tests detallados y troubleshooting
