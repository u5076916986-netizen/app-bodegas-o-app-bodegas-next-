import RepartidorEntregas from "./RepartidorEntregas";
import Breadcrumbs from "@/app/ui/Breadcrumbs";

export default function RepartidorEntregasPage() {
    return (
        <div className="space-y-4">
            <Breadcrumbs
                items={[
                    { label: "Inicio", href: "/inicio" },
                    { label: "Mis entregas" },
                ]}
            />
            <RepartidorEntregas />
        </div>
    );
}
