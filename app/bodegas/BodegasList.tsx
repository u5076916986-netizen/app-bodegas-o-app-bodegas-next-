"use client";



























type Bodega = {
  bodega_id: string;
  nombre: string;
  ciudad?: string;
  zona?: string;
  min_pedido_cop?: number;
  tiempo_entrega_estimado?: string;
  metodos_pago?: string;
  horario_texto?: string;
};

interface BodegasListProps {
  bodegas?: Bodega[];
  themes?: Record<string, any>;
  fallbackTheme?: any;
}

export default function BodegasList({ bodegas = [], themes = {}, fallbackTheme }: BodegasListProps) {
  if (!Array.isArray(bodegas) || bodegas.length === 0) {
    return <div className="text-center text-slate-500 py-8">No hay bodegas disponibles.</div>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bodegas.map((bodega) => {
        if (!bodega) return null;
        const theme = themes[bodega.bodega_id] ?? fallbackTheme;
        return (
          <a
            key={bodega.bodega_id}
            href={`/bodegas/${bodega.bodega_id}`}
            className="space-y-4 border rounded p-4 bg-white block hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-slate-900 text-sm truncate">{bodega.nombre}</h3>
            <p className="text-xs text-slate-600 mt-1 truncate">{bodega.ciudad} • {bodega.zona}</p>
            <p className="text-slate-500">Min: {bodega.min_pedido_cop}</p>
            <p className="text-slate-500">Entrega: {bodega.tiempo_entrega_estimado}</p>
            {bodega.metodos_pago && (
              <p className="mt-2 text-xs text-slate-600 truncate">💳 {bodega.metodos_pago}</p>
            )}
            {bodega.horario_texto && (
              <p className="mt-1 text-xs text-slate-500 truncate">🕐 {bodega.horario_texto}</p>
            )}
          </a>
        );
      })}
    </div>
  );
}
