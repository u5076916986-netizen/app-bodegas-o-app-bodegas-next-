import Link from "next/link";
import { getCupones } from "@/lib/cupones.server";
import CuponesClient from "./CuponesClient";

export const metadata = {
    title: "Cupones | Bodega",
};

export default async function CuponesPage() {
    const allCupones = await getCupones();
    
    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Breadcrumb */}
            <div className="mb-4 text-sm text-gray-600">
                <Link href="/bodega" className="text-blue-600 hover:underline">Panel Bodega</Link>
                <span className="mx-2">›</span>
                <span className="font-medium">Cupones</span>
            </div>

            <h1 className="text-2xl font-bold mb-4">Gestión de Cupones</h1>
            <CuponesClient initialCupones={allCupones} />
        </div>
    );
}
