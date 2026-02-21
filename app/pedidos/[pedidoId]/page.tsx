import { notFound } from "next/navigation";
import Link from "next/link";
import { getPedidoById } from "@/lib/pedidos.server";
import BodegaThemeShell from "@/components/theme/BodegaThemeShell";
import TrackingQR from "@/components/TrackingQR";
import { getBodegaById } from "@/lib/csv";

type Props = {
  params: Promise<{ pedidoId: string }>;
};

export default async function PedidoPage({ params }: Props) {
  const { pedidoId } = await params;
  const pedidoRaw = await getPedidoById(pedidoId);
  const pedido = pedidoRaw
    ? ({
      ...pedidoRaw,
      pedidoId: pedidoRaw.id,
      repartidorNombre: 'repartidorNombre' in pedidoRaw ? pedidoRaw.repartidorNombre as string | undefined : undefined,
      repartidorTelefono: 'repartidorTelefono' in pedidoRaw ? pedidoRaw.repartidorTelefono as string | undefined : undefined,
      totalOriginal: (pedidoRaw as any).totalOriginal ?? null,
    } as import("@/lib/pedidos").Pedido)
    : null;

  if (!pedido) {
    notFound();
  }

  const bodega = pedido?.bodegaId ? await getBodegaById(pedido.bodegaId) : null;

  const formatCurrency = (val: number) =>
    val.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/D";
    if (value instanceof Date) {
      return value.toISOString().slice(0, 16).replace("T", " ");
    }
    // Si es string, intentar parsear
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString().slice(0, 16).replace("T", " ");
  };

  const timeline = [
    "nuevo",
    "confirmado",
    "asignado",
    "en_bodega",
    "recogido",
    "en_ruta",
    "entregado",
  ] as const;
  const currentEstado = pedido.estado || "nuevo";
  const currentIndex = timeline.indexOf(currentEstado as (typeof timeline)[number]);

  const origin = bodega?.direccion
    ? `${bodega.direccion}${bodega.ciudad ? `, ${bodega.ciudad}` : ""}`
    : "";
  const destination = pedido.direccion || "";
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}${origin ? `&origin=${encodeURIComponent(origin)}` : ""}`;

  return (
    <BodegaThemeShell bodegaId={pedido.bodegaId}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-[color:var(--text-normal)]">
          <Link href="/pedidos" className="text-sky-700 hover:underline">
            &larr; Volver a mis pedidos
          </Link>
        </div>

        <header className="border-b border-[color:var(--surface-border)] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[color:var(--text-strong)]">
                Pedido Recibido
              </h1>
              <p className="text-sm text-[color:var(--text-muted)]">
                ID: {pedido.pedidoId}
              </p>
              <p className="text-sm text-[color:var(--text-muted)]">
                Fecha: {formatDate(pedido.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                {pedido.estado.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">
                Seguimiento del pedido
              </h2>
              <p className="text-sm text-[color:var(--text-muted)]">
                Estado actual: {currentEstado.replace("_", " ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pedido.repartidorNombre || pedido.repartidorId ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Repartidor: {pedido.repartidorNombre || pedido.repartidorId}
                </span>
              ) : null}
              {pedido.repartidorTelefono ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Tel: {pedido.repartidorTelefono}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {timeline.map((step, index) => {
              const active = currentIndex >= index && currentIndex >= 0;
              return (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${active
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {step.replace("_", " ")}
                  </span>
                  {index < timeline.length - 1 ? (
                    <span className="text-slate-300">→</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">
                Productos
              </h2>
              <div className="space-y-4">
                {pedido.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b border-slate-100 pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-[color:var(--text-strong)]">
                        {item.nombre || `Producto ${item.productoId}`}
                      </div>
                      <div className="text-sm text-[color:var(--text-muted)]">
                        x{item.cantidad}
                      </div>
                    </div>
                    <div className="font-medium text-[color:var(--text-strong)]">
                      {item.subtotal
                        ? formatCurrency(item.subtotal)
                        : formatCurrency((item.precio_cop || 0) * item.cantidad)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 border-t border-[color:var(--surface-border)] pt-4">
                {pedido.totalOriginal && pedido.totalOriginal !== pedido.total && (
                  <div className="flex justify-between text-sm text-[color:var(--text-normal)]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(pedido.totalOriginal)}</span>
                  </div>
                )}
                {pedido.coupon && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Cupón ({pedido.coupon.code})</span>
                    <span>- {formatCurrency(pedido.coupon.descuentoCOP)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-[color:var(--text-strong)]">
                  <span>Total</span>
                  <span>{formatCurrency(pedido.total)}</span>
                </div>
                {pedido.pointsEarned ? (
                  <div className="mt-2 rounded-lg bg-sky-50 p-2 text-center text-sm font-medium text-sky-700">
                    ✨ Ganaste {pedido.pointsEarned} puntos
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            {destination ? (
              <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">
                  Ruta a la entrega
                </h3>
                <p className="mb-4 text-xs text-[color:var(--text-muted)]">
                  Abre la navegación desde la bodega hasta el cliente.
                </p>
                <Link
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Abrir navegación
                </Link>
              </div>
            ) : null}
            {pedido.trackingCode && (
              <div className="flex flex-col items-center rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm text-center">
                <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Seguimiento</h3>
                <p className="mb-4 text-xs text-[color:var(--text-muted)]">Escanea para ver el estado</p>
                <TrackingQR trackingCode={pedido.trackingCode} />
                <p className="mt-4 font-mono text-lg font-bold text-slate-700">{pedido.trackingCode}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </BodegaThemeShell>
  );
}