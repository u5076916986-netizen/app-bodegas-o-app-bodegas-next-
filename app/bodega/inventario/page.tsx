
import { readFile } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';

interface Bodega {
  bodega_id: string;
  nombre: string;
}

interface Producto {
  productoId: string;
  bodegaId: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  precioVenta: number;
  unidad: string;
}

async function getBodegas(): Promise<Bodega[]> {
  const csv = await readFile(join(process.cwd(), 'data', 'bodegas.csv'), 'utf-8');
  const { data } = Papa.parse(csv, { header: true });
  return (data as any[]).map((row) => ({ bodega_id: row.bodega_id, nombre: row.nombre }));
}

async function getInventario(): Promise<Producto[]> {
  const json = await readFile(join(process.cwd(), 'data', 'inventario.json'), 'utf-8');
  return JSON.parse(json);
}

export default async function InventarioPage() {
  const bodegas = await getBodegas();
  const inventario = await getInventario();

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Inventario por Bodega</h1>
      {bodegas.map((bodega) => {
        const productos = inventario.filter((p) => p.bodegaId === bodega.bodega_id);
        return (
          <div key={bodega.bodega_id} className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{bodega.nombre}</h2>
            {productos.length === 0 ? (
              <p className="text-slate-500">Sin productos registrados.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-[600px] w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Categoría</th>
                      <th className="px-4 py-2 text-right">Stock</th>
                      <th className="px-4 py-2 text-right">Mínimo</th>
                      <th className="px-4 py-2 text-right">Máximo</th>
                      <th className="px-4 py-2 text-right">Precio</th>
                      <th className="px-4 py-2 text-left">Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((prod) => (
                      <tr key={prod.productoId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2">{prod.nombre}</td>
                        <td className="px-4 py-2">{prod.categoria}</td>
                        <td className="px-4 py-2 text-right">{prod.stockActual}</td>
                        <td className="px-4 py-2 text-right">{prod.stockMinimo}</td>
                        <td className="px-4 py-2 text-right">{prod.stockMaximo}</td>
                        <td className="px-4 py-2 text-right">${prod.precioVenta?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-2">{prod.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
