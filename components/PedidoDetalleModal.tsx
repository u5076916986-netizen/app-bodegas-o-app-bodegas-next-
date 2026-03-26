"use client";
import { Dialog } from "@headlessui/react";

interface PedidoItem {
    nombre: string;
    cantidad: number;
    precio: number;
}

interface Pedido {
    pedidoId: string;
    createdAt: string;
    cliente: { nombre: string; telefono: string };
    direccion: string;
    items: PedidoItem[];
    total: number;
    estado: string;
}

interface PedidoDetalleModalProps {
    open: boolean;
    onClose: () => void;
    pedido: Pedido | null;
}

export default function PedidoDetalleModal({ open, onClose, pedido }: PedidoDetalleModalProps) {
    if (!pedido) return null;
    return (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Dialog.Panel className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
                <button className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800" onClick={onClose} aria-label="Cerrar">×</button>
                <h2 className="text-xl font-bold mb-2">Pedido {pedido.pedidoId}</h2>
                <div className="text-xs text-slate-500 mb-2">{new Date(pedido.createdAt).toLocaleString()}</div>
                <div className="mb-2 text-sm">
                    <div><span className="font-semibold">Cliente:</span> {pedido.cliente?.nombre} ({pedido.cliente?.telefono})</div>
                    <div><span className="font-semibold">Dirección:</span> {pedido.direccion}</div>
                </div>
                <div className="mb-2">
                    <ul className="text-xs text-slate-700 list-disc ml-4">
                        {pedido.items.map((item, idx) => (
                            <li key={idx}>{item.nombre} × {item.cantidad} <span className="text-slate-500">(${item.precio.toLocaleString("es-CO")})</span></li>
                        ))}
                    </ul>
                </div>
                <div className="font-bold text-right text-lg text-green-700 mb-2">
                    Total: ${pedido.total.toLocaleString("es-CO")}
                </div>
                <div className="mb-2 text-sm"><span className="font-semibold">Estado:</span> {pedido.estado}</div>
                {/* Botones de acción pueden ir aquí si se requiere */}
            </Dialog.Panel>
        </Dialog>
    );
}
