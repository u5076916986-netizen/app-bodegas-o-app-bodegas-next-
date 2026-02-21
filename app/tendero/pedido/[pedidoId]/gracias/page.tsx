import Link from "next/link";
import { getPedidoById } from "@/lib/pedidos.server";
import GraciasClient from "./gracias-client";
import { getLedgerEntryByPedidoId } from "@/lib/ledger";

export default async function GraciasPage({
    params,
}: {
    params: Promise<{ pedidoId: string }>;
}) {
    const { pedidoId } = await params;
    const pedido = await getPedidoById(pedidoId);

    if (!pedido) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">Pedido no encontrado</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        No se pudo cargar la información del pedido.
                    </p>
                    <Link
                        href="/tendero"
                        className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Volver a bodegas
                    </Link>
                </div>
            </main>
        );
    }

    const total = pedido?.total ?? 0;
    const direccion = ('datosEntrega' in pedido && (pedido.datosEntrega as any)?.direccion) ? (pedido.datosEntrega as any).direccion : "Sin dirección";
    const ledgerEntry = await getLedgerEntryByPedidoId(pedido?.id ?? "");
    const puntosGanados = ledgerEntry?.puntosTendero ?? 0;
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900">¡Pedido confirmado!</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Pedido {pedido.id} • Estado {pedido.estado}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                        <p className="text-lg font-semibold text-slate-900">
                            {formatCurrency(total)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Dirección</p>
                        <p className="text-sm font-semibold text-slate-900">{direccion}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Puntos ganados</p>
                        <p className="text-lg font-semibold text-emerald-900">{puntosGanados}</p>
                    </div>
                </div>
                <Link
                    href={`/tendero/seguimiento/${encodeURIComponent(pedido?.id ?? "")}`}
                    className="mt-6 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                    Ver seguimiento
                </Link>
            </div>

            <GraciasClient
                bodegaId={pedido?.bodegaId || ""}
                items={Array.isArray(pedido?.items) ? (pedido.items as { productoId: string; nombre?: string; sku?: string }[]) : []}
            />
        </main>
    );
}
