
import { Suspense } from "react";
import BodegaPedidos from "@/components/BodegaPedidos";

export default function BodegaPage() {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Pedidos recibidos</h1>
            <Suspense fallback={<div className="p-8 text-center">Cargando pedidos...</div>}>
                <BodegaPedidos />
            </Suspense>
        </main>
    );
}

