import CheckoutClient from "./CheckoutClient";
import { Suspense } from "react";

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="p-4">Cargando...</div>}>
            <CheckoutClient />
        </Suspense>
    );
}
