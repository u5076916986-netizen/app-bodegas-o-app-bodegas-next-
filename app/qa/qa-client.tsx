"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCart, setActiveBodega, type CartItem } from "@/lib/cart";

type Producto = {
    id: string;
    bodegaId: string;
    nombre: string;
    precio: number;
    sku?: string;
    stock?: number;
    activo?: boolean;
};

export default function QaClient() {
    const router = useRouter();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/data/productos.json", { cache: "no-store" });
                const data = await res.json();
                setProductos(Array.isArray(data) ? data : []);
            } catch {
                setProductos([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const productoBase = useMemo(() => productos.find((p) => p.activo !== false) ?? null, [productos]);
    const bodegaId = productoBase?.bodegaId ?? "BOD_002";

    const buildCartItems = () => {
        if (!productoBase) return [] as CartItem[];
        const second = productos.find((p) => p.bodegaId === bodegaId && p.id !== productoBase.id) ?? productoBase;
        return [
            {
                productoId: productoBase.id,
                nombre: productoBase.nombre,
                precio: productoBase.precio,
                quantity: 1,
                sku: productoBase.sku,
            },
            {
                productoId: second.id,
                nombre: second.nombre,
                precio: second.precio,
                quantity: 1,
                sku: second.sku,
            },
        ];
    };

    const simulateTendero = () => {
        const items = buildCartItems();
        if (items.length === 0) {
            setStatus("No hay productos para simular carrito.");
            return;
        }
        saveCart(bodegaId, items);
        setActiveBodega(bodegaId);
        router.push(`/bodegas/${encodeURIComponent(bodegaId)}`);
    };

    const simulateRepartidor = async () => {
        try {
            setStatus("Creando pedido para repartidor...");
            const items = buildCartItems();
            if (items.length === 0) {
                setStatus("No hay productos para simular entrega.");
                return;
            }
            const pedidoId =
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `PED_QA_${Date.now()}`;

            const payload = {
                pedidoId,
                bodegaId,
                estado: "nuevo",
                cliente: {
                    nombre: "Cliente QA",
                    telefono: "3000000000",
                },
                direccion: "Av. 33 #50-08, Bogotá",
                items: items.map((item) => ({
                    productoId: item.productoId,
                    nombre: item.nombre,
                    sku: item.sku,
                    precio: item.precio,
                    precio_cop: item.precio,
                    cantidad: item.quantity,
                    subtotal: item.precio ? item.precio * (item.quantity ?? 1) : 0,
                })),
                total: items.reduce((sum, item) => sum + (item.precio ?? 0) * (item.quantity ?? 1), 0),
                datosEntrega: {
                    nombre: "Cliente QA",
                    telefono: "3000000000",
                    direccion: "Av. 33 #50-08, Bogotá",
                    notas: "QA",
                },
            };

            const createRes = await fetch("/api/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                setStatus("No se pudo crear el pedido QA.");
                return;
            }

            await fetch(`/api/pedidos/${encodeURIComponent(pedidoId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: "confirmado" }),
            });

            await fetch(`/api/pedidos/${encodeURIComponent(pedidoId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estado: "asignado",
                    repartidorId: "REP_001",
                    repartidorNombre: "Repartidor QA",
                    repartidorTelefono: "3110000000",
                }),
            });

            setStatus(null);
            router.push("/repartidor/entregas");
        } catch {
            setStatus("Error creando pedido QA.");
        }
    };

    const simulateBodegaImport = () => {
        router.push(`/bodega/${encodeURIComponent(bodegaId)}/cargar-productos?qaTemplate=1`);
    };

    return (
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">QA Simulator</h1>
                <p className="text-sm text-slate-600">Ejecuta flujos reales sin romper el flujo.</p>
            </header>

            {status ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {status}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
                <button
                    type="button"
                    onClick={simulateTendero}
                    disabled={loading}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                    <p className="text-sm font-semibold text-slate-900">Simular Tendero Compra</p>
                    <p className="text-xs text-slate-500 mt-1">Abre una bodega y precarga 2 items.</p>
                </button>
                <button
                    type="button"
                    onClick={simulateRepartidor}
                    disabled={loading}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                    <p className="text-sm font-semibold text-slate-900">Simular Repartidor</p>
                    <p className="text-xs text-slate-500 mt-1">Crea un pedido asignado y abre entregas.</p>
                </button>
                <button
                    type="button"
                    onClick={simulateBodegaImport}
                    disabled={loading}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                    <p className="text-sm font-semibold text-slate-900">Simular Bodega Import</p>
                    <p className="text-xs text-slate-500 mt-1">Abre cargue con plantilla QA.</p>
                </button>
            </div>
        </div>
    );
}
