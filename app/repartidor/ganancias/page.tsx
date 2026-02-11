import Breadcrumbs from "@/app/ui/Breadcrumbs";
import { readLedger } from "@/lib/ledger";

const REPARTIDOR_ID = "REP_001";

const sumBetween = (entries: Array<{ createdAt: string; gananciaRepartidor: number }>, from: Date, to: Date) => {
    return entries
        .filter((entry) => {
            const date = new Date(entry.createdAt);
            return date >= from && date <= to;
        })
        .reduce((sum, entry) => sum + (entry.gananciaRepartidor ?? 0), 0);
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);

const formatDate = (value: string) => new Date(value).toISOString().replace("T", " ").slice(0, 16);

export default async function RepartidorGananciasPage() {
    const ledger = await readLedger();
    const entries = ledger.filter((entry) => entry.repartidorId === REPARTIDOR_ID);

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const startWeek = new Date(today);
    startWeek.setDate(today.getDate() - today.getDay());
    startWeek.setHours(0, 0, 0, 0);

    const totalHoy = sumBetween(entries, startToday, endToday);
    const totalSemana = sumBetween(entries, startWeek, endToday);

    return (
        <div className="space-y-4">
            <Breadcrumbs
                items={[
                    { label: "Inicio", href: "/inicio" },
                    { label: "Repartidor", href: "/repartidor" },
                    { label: "Ganancias" },
                ]}
            />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-6xl px-4 py-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-900">Ganancias</h1>
                        <p className="text-slate-600 mt-1">Repartidor {REPARTIDOR_ID}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                            <p className="text-sm text-slate-600 mb-1">Total hoy</p>
                            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalHoy)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                            <p className="text-sm text-slate-600 mb-1">Total semana</p>
                            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalSemana)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-900">Entregas</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Pedido</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Fecha</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-900">Ganancia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                                                Sin entregas registradas
                                            </td>
                                        </tr>
                                    ) : (
                                        entries
                                            .slice()
                                            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                                            .map((entry) => (
                                                <tr key={entry.id} className="border-b border-slate-100">
                                                    <td className="px-4 py-3 text-slate-700 font-mono">
                                                        {entry.pedidoId}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {formatDate(entry.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                                                        {formatCurrency(entry.gananciaRepartidor)}
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
