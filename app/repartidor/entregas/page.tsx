import RepartidorEntregas from "./RepartidorEntregas";
import Breadcrumbs from "@/app/ui/Breadcrumbs";
import { Suspense } from "react";

export default function RepartidorEntregasPage() {
    return (
        <div className="space-y-4">
            <Breadcrumbs
                items={[
                    { label: "Inicio", href: "/inicio" },
                    { label: "Mis entregas" },
                ]}
            />
            <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <RepartidorEntregas />
            </Suspense>
        </div>
    );
}
