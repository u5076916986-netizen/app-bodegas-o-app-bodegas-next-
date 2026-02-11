"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import ProductForm from "@/components/ProductForm";
import type { ProductFormValues } from "@/components/ProductForm";
import { buildFuseIndex, smartSearch } from "@/lib/smartSearch";
import { expandQuery } from "@/lib/synonyms";

export interface Producto {
    id: string;
    bodegaId: string;
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo: boolean;
    descripcion?: string;
    updatedAt: string;
}

type ModalView = "form" | null;
type TabType = "catalogo" | "precios" | "stock";

interface ProductosClientProps {
    bodegaId: string;
}

interface EditingPrice {
    productId: string;
    newPrice: number;
}

interface EditingStock {
    productId: string;
    newStock: number;
    newStockMin: number;
}

export default function ProductosClient({ bodegaId }: ProductosClientProps) {
    const [products, setProducts] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [estado, setEstado] = useState<"todos" | "activo" | "inactivo">("todos");
    const [categoria, setCategoria] = useState("todas");
    const [stockFilter, setStockFilter] = useState<"all" | "zero" | "low">("all");
    const [modalView, setModalView] = useState<ModalView>(null);
    const [editing, setEditing] = useState<Producto | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("catalogo");
    const [editingPrice, setEditingPrice] = useState<EditingPrice | null>(null);
    const [editingStock, setEditingStock] = useState<EditingStock | null>(null);
    const searchParams = useSearchParams();
    const autoOpenedRef = useRef(false);
    const filterAppliedRef = useRef(false);

    useEffect(() => {
        if (autoOpenedRef.current) return;
        if (searchParams.get("nuevo") === "1") {
            autoOpenedRef.current = true;
            setEditing(null);
            setModalView("form");
        }
    }, [searchParams]);

    useEffect(() => {
        if (filterAppliedRef.current) return;
        const stockParam = searchParams.get("stock");
        if (stockParam === "zero" || stockParam === "low") {
            setStockFilter(stockParam);
            filterAppliedRef.current = true;
        }
    }, [searchParams]);

    // Cargar productos del API
    const loadProductos = useCallback(async () => {
        if (!bodegaId) {
            setError("Falta el ID de la bodega");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`/api/productos?bodegaId=${bodegaId}`);
            const result = await response.json();
            if (result.ok) {
                setProducts(result.data);
                setError(null);
            } else {
                setError(result.error || "Error cargando productos");
            }
        } catch (err) {
            setError("Error cargando productos");
        } finally {
            setLoading(false);
        }
    }, [bodegaId]);

    useEffect(() => {
        loadProductos();
    }, [loadProductos]);

    const categories = useMemo(() => {
        const set = new Set(products.map((p) => p.categoria).filter(Boolean));
        return ["todas", ...Array.from(set).sort()];
    }, [products]);

    const { fuse } = useMemo(
        () =>
            buildFuseIndex(
                products.map((p) => ({
                    ...p,
                    presentacion: "",
                    tags: [p.descripcion ?? ""],
                })),
            ),
        [products],
    );

    const totalCount = products.length;
    const sinStockCount = products.filter((p) => p.stock === 0).length;

    const filtered = useMemo(() => {
        let list = products;
        if (query.trim()) {
            const expanded = expandQuery(query);
            list = smartSearch(fuse, expanded, 500) as Producto[];
        }
        return list.filter((p) => {
            const matchesEstado =
                estado === "todos" || (estado === "activo" ? p.activo : !p.activo);
            const matchesCategoria = categoria === "todas" || p.categoria === categoria;
            const matchesStock =
                stockFilter === "all"
                    ? true
                    : stockFilter === "zero"
                        ? p.stock === 0
                        : p.stock > 0 && p.stock <= 10;
            return matchesEstado && matchesCategoria && matchesStock;
        });
    }, [products, query, estado, categoria, fuse, stockFilter]);

    const handleCreate = () => {
        setEditing(null);
        setModalView("form");
    };

    const handleEdit = (product: Producto) => {
        setEditing(product);
        setModalView("form");
    };

    const handleSave = async (values: ProductFormValues) => {
        try {
            const url = editing
                ? `/api/productos`
                : `/api/productos`;
            const method = editing ? "PUT" : "POST";
            const payload = editing
                ? { id: editing.id, bodegaId, ...values }
                : { bodegaId, ...values };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (result.ok) {
                setModalView(null);
                setEditing(null);
                await loadProductos();
            } else {
                setError(result.error || "Error guardando producto");
            }
        } catch (err) {
            setError("Error guardando producto");
        }
    };

    const handleDuplicate = async (product: Producto) => {
        try {
            const response = await fetch("/api/productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bodegaId,
                    nombre: `${product.nombre} (Copia)`,
                    sku: `${product.sku}-copy`,
                    categoria: product.categoria,
                    precio: product.precio,
                    stock: product.stock,
                    activo: false,
                    descripcion: product.descripcion,
                }),
            });

            const result = await response.json();
            if (result.ok) {
                await loadProductos();
            } else {
                setError(result.error || "Error duplicando producto");
            }
        } catch (err) {
            setError("Error duplicando producto");
        }
    };

    const handleToggle = async (product: Producto) => {
        try {
            const response = await fetch("/api/productos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: product.id,
                    activo: !product.activo,
                }),
            });

            const result = await response.json();
            if (result.ok) {
                await loadProductos();
            } else {
                setError(result.error || "Error actualizando producto");
            }
        } catch (err) {
            setError("Error actualizando producto");
        }
    };

    const handleDelete = async (product: Producto) => {
        if (!window.confirm(`¿Eliminar "${product.nombre}"?`)) return;
        try {
            const response = await fetch(`/api/productos?id=${product.id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (result.ok) {
                await loadProductos();
            } else {
                setError(result.error || "Error eliminando producto");
            }
        } catch (err) {
            setError("Error eliminando producto");
        }
    };

    const handleSavePrice = async (productId: string, newPrice: number) => {
        try {
            const response = await fetch("/api/productos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: productId,
                    precio: newPrice,
                }),
            });

            const result = await response.json();
            if (result.ok) {
                setEditingPrice(null);
                await loadProductos();
            } else {
                setError(result.error || "Error actualizando precio");
            }
        } catch (err) {
            setError("Error actualizando precio");
        }
    };

    const handleSaveStock = async (productId: string, newStock: number) => {
        try {
            const response = await fetch("/api/productos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: productId,
                    stock: newStock,
                }),
            });

            const result = await response.json();
            if (result.ok) {
                setEditingStock(null);
                await loadProductos();
            } else {
                setError(result.error || "Error actualizando stock");
            }
        } catch (err) {
            setError("Error actualizando stock");
        }
    };

    const columns = [
        {
            key: "foto",
            label: "Foto",
            render: (_: unknown, row: Producto) => (
                <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                    {row.nombre.slice(0, 2).toUpperCase()}
                </div>
            ),
        },
        { key: "nombre", label: "Nombre" },
        { key: "sku", label: "SKU" },
        { key: "categoria", label: "Categoría" },
        ...(activeTab === "catalogo"
            ? [
                {
                    key: "precio",
                    label: "Precio",
                    render: (value: number) => `$${value.toLocaleString("es-CO")}`,
                },
                {
                    key: "stock",
                    label: "Stock",
                    render: (value: number) => (
                        <span className={value === 0 ? "text-red-600 font-semibold" : ""}>
                            {value === 0 ? "SIN STOCK" : value}
                        </span>
                    ),
                },
                {
                    key: "activo",
                    label: "Estado",
                    render: (value: boolean) => (
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${value ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                                }`}
                        >
                            {value ? "Activo" : "Inactivo"}
                        </span>
                    ),
                },
            ]
            : []),
        ...(activeTab === "precios"
            ? [
                {
                    key: "precio",
                    label: "Precio",
                    render: (_: unknown, row: Producto) =>
                        editingPrice?.productId === row.id ? (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={editingPrice.newPrice}
                                    onChange={(e) =>
                                        setEditingPrice({
                                            ...editingPrice,
                                            newPrice: Number(e.target.value),
                                        })
                                    }
                                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                                    aria-label="Nuevo precio"
                                />
                                <button
                                    onClick={() => handleSavePrice(row.id, editingPrice.newPrice)}
                                    className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                                    aria-label="Guardar precio"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={() => setEditingPrice(null)}
                                    className="rounded-md bg-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-400"
                                    aria-label="Cancelar edición de precio"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() =>
                                    setEditingPrice({ productId: row.id, newPrice: row.precio })
                                }
                                className="text-blue-600 hover:underline"
                                aria-label={`Editar precio: $${row.precio}`}
                            >
                                ${row.precio.toLocaleString("es-CO")}
                            </button>
                        ),
                },
            ]
            : []),
        ...(activeTab === "stock"
            ? [
                {
                    key: "stock",
                    label: "Stock",
                    render: (_: unknown, row: Producto) =>
                        editingStock?.productId === row.id ? (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={editingStock.newStock}
                                    onChange={(e) =>
                                        setEditingStock({
                                            ...editingStock,
                                            newStock: Number(e.target.value),
                                        })
                                    }
                                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
                                    aria-label="Nuevo stock"
                                />
                                <button
                                    onClick={() => handleSaveStock(row.id, editingStock.newStock)}
                                    className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                                    aria-label="Guardar stock"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={() => setEditingStock(null)}
                                    className="rounded-md bg-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-400"
                                    aria-label="Cancelar edición de stock"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() =>
                                    setEditingStock({
                                        productId: row.id,
                                        newStock: row.stock,
                                        newStockMin: 5,
                                    })
                                }
                                className={`${row.stock === 0 ? "text-red-600 font-semibold hover:underline" : "text-blue-600 hover:underline"}`}
                                aria-label={`Editar stock: ${row.stock}`}
                            >
                                {row.stock === 0 ? "SIN STOCK" : row.stock}
                            </button>
                        ),
                },
            ]
            : []),
    ];

    const actions = [
        {
            label: "Editar",
            onClick: handleEdit,
            className: "text-blue-600 hover:bg-blue-50",
        },
        {
            label: "Activar/Desactivar",
            onClick: handleToggle,
            className: "text-slate-700 hover:bg-slate-100",
        },
        {
            label: "Duplicar",
            onClick: handleDuplicate,
            className: "text-purple-600 hover:bg-purple-50",
        },
        {
            label: "Eliminar",
            onClick: handleDelete,
            className: "text-red-600 hover:bg-red-50",
        },
    ];

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
                    <p className="text-sm text-slate-600">
                        {loading ? "Cargando..." : `${totalCount} productos${sinStockCount > 0 ? ` • ${sinStockCount} sin stock` : ""}`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/bodega/${bodegaId}/cargar-productos`}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Cargar productos
                    </Link>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Nuevo producto
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200" role="tablist" aria-label="Secciones de productos">
                {(["catalogo", "precios", "stock"] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                        role="tab"
                    >
                        {tab === "catalogo" && "Catálogo"}
                        {tab === "precios" && "Precios"}
                        {tab === "stock" && "Stock"}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <label htmlFor="product-search" className="block text-sm font-medium text-slate-700">
                        Buscar
                    </label>
                    <input
                        id="product-search"
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Buscar por nombre o SKU"
                    />
                </div>
                <div>
                    <label htmlFor="product-estado" className="block text-sm font-medium text-slate-700">
                        Estado
                    </label>
                    <select
                        id="product-estado"
                        value={estado}
                        onChange={(event) => setEstado(event.target.value as "todos" | "activo" | "inactivo")}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="todos">Todos</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="product-categoria" className="block text-sm font-medium text-slate-700">
                        Categoría
                    </label>
                    <select
                        id="product-categoria"
                        value={categoria}
                        onChange={(event) => setCategoria(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat === "todas" ? "Todas" : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-slate-600">Cargando productos...</div>
            ) : (
                <Table
                    columns={columns}
                    data={filtered}
                    actions={activeTab === "catalogo" ? actions : []}
                    emptyMessage="No hay productos que coincidan"
                />
            )}

            <Modal
                isOpen={modalView === "form"}
                title={editing ? "Editar producto" : "Nuevo producto"}
                onClose={() => {
                    setModalView(null);
                    setEditing(null);
                }}
                size="lg"
            >
                <ProductForm
                    initialValues={editing ?? undefined}
                    onSubmit={handleSave}
                    onCancel={() => {
                        setModalView(null);
                        setEditing(null);
                    }}
                />
            </Modal>

        </div>
    );
}
