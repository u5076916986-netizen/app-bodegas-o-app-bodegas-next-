import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoById } from "@/lib/pedidos.server";
import BodegaThemeShell from "@/components/theme/BodegaThemeShell";
import TenderoNotifications from "@/components/TenderoNotifications";
import { getBodegaById } from "@/lib/csv";
import SeguimientoRecommendations from "./SeguimientoRecommendations";
import StepperNav from "@/components/StepperNav";
import CopyActions from "./CopyActions";
import EtaCountdown from "./EtaCountdown";

export default async function SeguimientoPage({
    params,
}: {
    params: Promise<{ pedidoId: string }>;
}) {
    const { pedidoId } = await params;
    const pedido = await getPedidoById(pedidoId);

    if (!pedido) {
        notFound();
    }

    const formatDate = (value?: string) => {
        if (!value) return "N/D";
        return new Date(value).toISOString().slice(0, 16).replace("T", " ");
    };

    const bodega = pedido?.bodegaId ? await getBodegaById(pedido.bodegaId) : null;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);

    const parseEstimadoHoras = (estimado?: string | null) => {
        if (!estimado) return null;
        const matches = estimado.match(/(\d+)/g);
        if (!matches || matches.length === 0) return null;
        const nums = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
        if (nums.length === 0) return null;
        if (nums.length === 1) return { min: nums[0], max: nums[0] };
        const [min, max] = nums;
        return { min, max };
    };

    const steps = ["confirmado", "preparando", "asignado", "en_ruta", "entregado"] as const;
    const estadoRaw = String(pedido.estado || "confirmado");
    const estadoNormalizado =
        estadoRaw === "nuevo" || estadoRaw === "confirmado"
            ? "confirmado"
            : estadoRaw === "en_bodega" || estadoRaw === "recogido"
                ? "preparando"
                : estadoRaw === "asignado"
                    ? "asignado"
                    : estadoRaw === "en_ruta" || estadoRaw === "en_camino"
                        ? "en_ruta"
                        : estadoRaw === "entregado"
                            ? "entregado"
                            : "confirmado";
    const currentIndex = steps.indexOf(estadoNormalizado as (typeof steps)[number]);

    const estadoMeta: Record<string, { label: string; hint: string; badge: string }> = {
        confirmado: {
            label: "Confirmado",
            hint: "Tu pedido fue confirmado y ya esta en preparacion.",
            badge: "bg-blue-100 text-blue-800",
        },
        preparando: {
            label: "Preparando",
            hint: "La bodega esta alistando los productos.",
            badge: "bg-amber-100 text-amber-800",
        },
        asignado: {
            label: "Asignado",
            hint: "Ya hay un repartidor asignado a tu pedido.",
            badge: "bg-indigo-100 text-indigo-800",
        },
        en_ruta: {
            label: "En ruta",
            hint: "El repartidor va camino a la direccion de entrega.",
            badge: "bg-emerald-100 text-emerald-800",
        },
        entregado: {
            label: "Entregado",
            hint: "El pedido fue entregado. Gracias por comprar.",
            badge: "bg-slate-900 text-white",
        },
    };
    const estadoInfo = estadoMeta[estadoNormalizado] ?? estadoMeta.confirmado;

    const origin = bodega?.direccion
        ? `${bodega.direccion}${bodega.ciudad ? `, ${bodega.ciudad}` : ""}`
        : "";
    const destination = pedido.datosEntrega?.direccion || pedido.direccion || "";
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination,
    )}${origin ? `&origin=${encodeURIComponent(origin)}` : ""}`;
    const mapsEmbedUrl = destination
        ? `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`
        : "";
    const wazeUrl = destination
        ? `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`
        : "";
    const estimadoHoras = parseEstimadoHoras(bodega?.tiempo_entrega_estimado ?? null);
    const etaInfo = estimadoHoras && pedido.createdAt && estadoNormalizado === "en_ruta"
        ? (() => {
            const base = new Date(pedido.createdAt);
            const min = new Date(base.getTime() + estimadoHoras.min * 60 * 60 * 1000);
            const max = new Date(base.getTime() + estimadoHoras.max * 60 * 60 * 1000);
            return {
                etaMinISO: min.toISOString(),
                etaMaxISO: max.toISOString(),
            };
        })()
        : null;

    return (
        <BodegaThemeShell bodegaId={pedido.bodegaId}>
            <div className="space-y-6">
                <StepperNav currentStep="seguimiento" pedidoId={pedido.pedidoId || pedidoId} />
                <div className="flex items-center gap-3 text-sm text-[color:var(--text-normal)]">
                    <Link href="/pedidos" className="text-sky-700 hover:underline">
                        &larr; Volver a mis pedidos
                    </Link>
                </div>

                <TenderoNotifications />

                <header className="border-b border-[color:var(--surface-border)] pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[color:var(--text-strong)]">
                                Seguimiento del pedido
                            </h1>
                            <p className="text-sm text-[color:var(--text-muted)]">ID: {pedido.pedidoId}</p>
                            <p className="text-sm text-[color:var(--text-muted)]">
                                Fecha: {formatDate(pedido.createdAt)}
                            </p>
                            {pedido.trackingCode ? (
                                <p className="text-xs text-[color:var(--text-muted)]">
                                    Tracking: {pedido.trackingCode}
                                </p>
                            ) : null}
                            <div className="mt-3">
                                <CopyActions
                                    pedidoId={pedido.pedidoId || pedidoId}
                                    trackingCode={pedido.trackingCode}
                                    direccion={destination}
                                />
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${estadoInfo.badge}`}>
                                {estadoInfo.label}
                            </span>
                            <p className="mt-2 text-xs text-[color:var(--text-muted)] max-w-[220px]">
                                {estadoInfo.hint}
                            </p>
                        </div>
                    </div>
                </header>

                <section className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Timeline</h2>
                            <p className="text-sm text-[color:var(--text-muted)]">
                                Estado actual: {estadoNormalizado.replace("_", " ")}
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
                        {steps.map((step, index) => {
                            const active = currentIndex >= index && currentIndex >= 0;
                            return (
                                <div key={step} className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                                            }`}
                                    >
                                        {step === "en_ruta" ? "en ruta" : step}
                                    </span>
                                    {index < steps.length - 1 ? <span className="text-slate-300">→</span> : null}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4">
                        <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${Math.max(0, ((currentIndex + 1) / steps.length) * 100)}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            Progreso: {Math.max(0, currentIndex + 1)} de {steps.length}
                        </p>
                    </div>
                </section>

                <div className="grid gap-8 md:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <section className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Resumen</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">Productos</p>
                                    <p className="text-lg font-semibold text-slate-900">{pedido.items?.length ?? 0}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">Total</p>
                                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(pedido.total ?? 0)}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">Metodo de pago</p>
                                    <p className="text-sm font-semibold text-slate-900">{pedido.metodoPago || "No definido"}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">Direccion</p>
                                    <p className="text-sm text-slate-900">
                                        {pedido.datosEntrega?.direccion || pedido.direccion || "Sin direccion"}
                                    </p>
                                </div>
                                {bodega?.tiempo_entrega_estimado ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500">Entrega estimada</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {bodega.tiempo_entrega_estimado}
                                        </p>
                                        {etaInfo ? (
                                            <EtaCountdown
                                                etaMinISO={etaInfo.etaMinISO}
                                                etaMaxISO={etaInfo.etaMaxISO}
                                            />
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                            {pedido.discount && pedido.discount > 0 ? (
                                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    Descuento aplicado {pedido.coupon?.code ? `(${pedido.coupon.code})` : ""}: {formatCurrency(pedido.discount)}
                                </div>
                            ) : null}
                            {pedido.totalOriginal && pedido.totalOriginal > (pedido.total ?? 0) ? (
                                <p className="mt-2 text-xs text-slate-500">
                                    Total original: {formatCurrency(pedido.totalOriginal)}
                                </p>
                            ) : null}
                        </section>

                        <section className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Productos</h2>
                            <div className="space-y-3">
                                {(pedido.items ?? []).map((item, idx) => (
                                    <div key={`${item.productoId ?? item.sku ?? "item"}-${idx}`} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.nombre || "Producto"}</p>
                                            <p className="text-xs text-slate-500">SKU: {item.sku || item.productoId || "—"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-700">x{item.cantidad ?? 1}</p>
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(item.subtotal ?? (item.precio_cop ?? item.precio ?? 0) * (item.cantidad ?? 1))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(pedido.items ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-500">Sin productos registrados.</p>
                                ) : null}
                            </div>
                        </section>

                        <section className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-strong)]">Datos de entrega</h2>
                            <div className="grid gap-3 text-sm text-[color:var(--text-normal)]">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-500">Cliente</span>
                                    <span className="font-semibold text-slate-900">
                                        {pedido.datosEntrega?.nombre || pedido.cliente?.nombre || "Sin nombre"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-500">Telefono</span>
                                    <span className="font-semibold text-slate-900">
                                        {pedido.datosEntrega?.telefono || pedido.cliente?.telefono || "Sin telefono"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-500">Notas</span>
                                    <span className="text-right text-slate-900">
                                        {pedido.datosEntrega?.notas || "Sin notas"}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        {destination && estadoNormalizado === "en_ruta" ? (
                            <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                                <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Ruta a la entrega</h3>
                                <p className="mb-4 text-xs text-[color:var(--text-muted)]">
                                    Abre la navegacion desde la bodega hasta el cliente.
                                </p>
                                {mapsEmbedUrl ? (
                                    <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
                                        <iframe
                                            title="Mapa de entrega"
                                            src={mapsEmbedUrl}
                                            className="h-48 w-full"
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>
                                ) : null}
                                <div className="flex flex-col gap-2">
                                    <Link
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        Abrir ruta
                                    </Link>
                                    {wazeUrl ? (
                                        <Link
                                            href={wazeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Abrir Waze
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                        {destination && estadoNormalizado !== "en_ruta" ? (
                            <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                                <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Ruta a la entrega</h3>
                                <p className="text-xs text-[color:var(--text-muted)]">
                                    La ruta estara disponible cuando el pedido este en ruta.
                                </p>
                            </div>
                        ) : null}
                        <div className="rounded-xl border border-[color:var(--surface-border)] bg-white p-6 shadow-sm">
                            <h3 className="mb-2 font-semibold text-[color:var(--text-strong)]">Contacto de la bodega</h3>
                            <div className="space-y-2 text-sm text-[color:var(--text-normal)]">
                                <p className="text-slate-700">{bodega?.nombre || "Bodega"}</p>
                                {bodega?.telefono ? (
                                    <Link
                                        href={`tel:${bodega.telefono}`}
                                        className="text-sky-700 hover:underline"
                                    >
                                        {bodega.telefono}
                                    </Link>
                                ) : null}
                                {bodega?.correo_pedidos ? (
                                    <Link
                                        href={`mailto:${bodega.correo_pedidos}`}
                                        className="text-sky-700 hover:underline"
                                    >
                                        {bodega.correo_pedidos}
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                        <SeguimientoRecommendations
                            bodegaId={pedido.bodegaId || ""}
                            items={pedido.items ?? []}
                        />
                    </aside>
                </div>
            </div>
        </BodegaThemeShell>
    );
}
