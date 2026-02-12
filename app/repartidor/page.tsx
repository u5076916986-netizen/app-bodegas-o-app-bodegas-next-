import Breadcrumbs from "@/app/ui/Breadcrumbs";
import RepartidorEntregas from "./entregas/RepartidorEntregas";
import { Suspense } from "react";

export const metadata = {
    title: "Repartidor | app-bodegas",
};

export default function RepartidorPage() {
    return (
        <div className="space-y-4">
            <Breadcrumbs
                items={[
                    { label: "Inicio", href: "/inicio" },
                    { label: "Repartidor" },
                ]}
            />
            <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <RepartidorEntregas />
            </Suspense>
        </div>
    );
}
