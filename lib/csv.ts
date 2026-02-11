import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";

export type Bodega = {
  bodega_id: string;
  nombre: string;
  categoria_principal: string;
  correo_pedidos: string;
  telefono: string;
  ciudad: string;
  zona: string;
  direccion: string;
  horario_texto: string;
  metodos_pago: string;
  min_pedido_cop: number | null;
  tiempo_entrega_estimado: string;
  estado: string;
  logo_url: string;
};

export type Producto = {
  producto_id: string;
  bodega_id: string;
  nombre: string;
  categoria: string;
  precio_cop: number | null;
  stock: number | null;
  unidad: string;
  imagen_url: string;
  puntos_base: number | null;
  activo: boolean;
};

type BodegaRow = {
  bodega_id: string;
  nombre: string;
  categoria_principal: string;
  correo_pedidos: string;
  telefono: string;
  ciudad: string;
  zona: string;
  direccion: string;
  horario_texto: string;
  metodos_pago: string;
  min_pedido_cop: string;
  tiempo_entrega_estimado: string;
  estado: string;
  logo_url: string;
};

type ProductoRow = {
  producto_id: string;
  bodega_id: string;
  nombre: string;
  categoria: string;
  precio_cop: string;
  stock: string;
  unidad: string;
  imagen_url: string;
  puntos_base: string;
  activo: string;
};

const DATA_DIR = path.join(process.cwd(), "data");

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  if (typeof value === "boolean") return value;
  return false;
};

async function readCsv<T>(fileName: string): Promise<T[]> {
  const csvPath = path.join(DATA_DIR, fileName);
  const content = await fs.readFile(csvPath, "utf8");
  const result = Papa.parse<T>(content, { header: true, skipEmptyLines: true });

  if (result.errors.length) {
    console.warn(`Papaparse warnings for ${fileName}`, result.errors);
  }

  return result.data;
}

const mapBodega = (row: BodegaRow): Bodega => ({
  bodega_id: row.bodega_id,
  nombre: row.nombre,
  categoria_principal: row.categoria_principal,
  correo_pedidos: row.correo_pedidos,
  telefono: row.telefono,
  ciudad: row.ciudad,
  zona: row.zona,
  direccion: row.direccion,
  horario_texto: row.horario_texto,
  metodos_pago: row.metodos_pago,
  min_pedido_cop: toNumber(row.min_pedido_cop),
  tiempo_entrega_estimado: row.tiempo_entrega_estimado,
  estado: row.estado,
  logo_url: row.logo_url,
});

const mapProducto = (row: ProductoRow): Producto => ({
  producto_id: row.producto_id,
  bodega_id: row.bodega_id,
  nombre: row.nombre,
  categoria: row.categoria,
  precio_cop: toNumber(row.precio_cop),
  stock: toNumber(row.stock),
  unidad: row.unidad,
  imagen_url: row.imagen_url,
  puntos_base: toNumber(row.puntos_base),
  activo: toBoolean(row.activo),
});

export async function getBodegas(): Promise<Bodega[]> {
  const rows = await readCsv<BodegaRow>("bodegas.csv");
  return rows.filter((row) => row?.bodega_id).map(mapBodega);
}

export async function getBodegaById(id: string): Promise<Bodega | null> {
  const bodegas = await getBodegas();
  return bodegas.find((b) => b.bodega_id === id) ?? null;
}

export async function getProductos(): Promise<Producto[]> {
  const rows = await readCsv<ProductoRow>("productos.csv");
  return rows.filter((row) => row?.producto_id).map(mapProducto);
}

export async function getProductosByBodega(
  bodegaId: string,
): Promise<Producto[]> {
  const productos = await getProductos();
  return productos.filter((p) => p.bodega_id === bodegaId);
}

/**
 * Append a new product to the CSV file.
 * @param productoCsv CSV row string (comma-separated, must have 10 fields)
 */
export async function appendProducto(productoCsv: string): Promise<void> {
  const csvPath = path.join(DATA_DIR, "productos.csv");

  // Ensure DATA_DIR exists
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Append with newline if file exists and is not empty
  try {
    const stat = await fs.stat(csvPath);
    if (stat.size > 0) {
      await fs.appendFile(csvPath, "\n" + productoCsv);
    } else {
      await fs.writeFile(csvPath, productoCsv);
    }
  } catch (error) {
    // File doesn't exist yet, create it
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      await fs.writeFile(csvPath, productoCsv);
    } else {
      throw error;
    }
  }
}
