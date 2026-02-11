import { getProductos, getBodegas } from "@/lib/csv";
import BuscarClient from "./BuscarClient";

export const metadata = {
    title: "Buscar productos | app-bodegas",
};

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BuscarPage({ searchParams }: Props) {
    const resolved = await searchParams;
    const q = typeof resolved.q === "string" ? resolved.q : undefined;
    const initialCategory = typeof resolved.category === "string" ? resolved.category : undefined;
    const initialBodega = typeof resolved.bodegaId === "string" ? resolved.bodegaId : undefined;
    const initialZona = typeof resolved.zona === "string" ? resolved.zona : undefined;
    const initialMin = typeof resolved.minPrice === "string" ? resolved.minPrice : undefined;
    const initialMax = typeof resolved.maxPrice === "string" ? resolved.maxPrice : undefined;
    const initialSort = typeof resolved.sort === "string" ? resolved.sort : undefined;

    const productos = await getProductos();
    const bodegas = await getBodegas();

    const categorias = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort();
    const bodegasOpts = bodegas.map((b) => ({ id: b.bodega_id, nombre: b.nombre, zona: b.zona }));
    const zonas = Array.from(new Set(bodegas.map((b) => b.zona).filter(Boolean))).sort();

    return (
        <main className="mx-auto max-w-6xl p-6">
            <h1 className="text-2xl font-semibold mb-4">Buscar productos</h1>
            <BuscarClient
                initialQuery={q ?? ""}
                initialCategory={initialCategory}
                initialBodega={initialBodega}
                initialZona={initialZona}
                initialMinPrice={initialMin}
                initialMaxPrice={initialMax}
                initialSort={initialSort}
                categorias={categorias}
                bodegas={bodegasOpts}
                zonas={zonas}
            />
        </main>
    );
}
