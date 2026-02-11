"use client";

import { useMemo, useState } from "react";

export interface ProductFormValues {
    nombre: string;
    sku: string;
    categoria: string;
    precio: number;
    stock: number;
    activo: boolean;
    descripcion: string;
}

interface ProductFormProps {
    initialValues?: Partial<{
        id: string;
        nombre: string;
        sku: string;
        categoria: string;
        precio: number;
        stock: number;
        activo: boolean;
        descripcion?: string;
    }>;
    onSubmit: (values: ProductFormValues) => void;
    onCancel: () => void;
}

export default function ProductForm({
    initialValues,
    onSubmit,
    onCancel,
}: ProductFormProps) {
    const [values, setValues] = useState<ProductFormValues>({
        nombre: initialValues?.nombre ?? "",
        sku: initialValues?.sku ?? "",
        categoria: initialValues?.categoria ?? "",
        precio: initialValues?.precio ?? 0,
        stock: initialValues?.stock ?? 0,
        activo: initialValues?.activo ?? true,
        descripcion: initialValues?.descripcion ?? "",
    });

    const [touched, setTouched] = useState({
        nombre: false,
        sku: false,
        precio: false,
        stock: false,
    });

    const errors = useMemo(() => {
        const next: Record<string, string> = {};
        if (!values.nombre.trim()) next.nombre = "El nombre es obligatorio";
        if (!values.sku.trim()) next.sku = "El SKU es obligatorio";
        if (values.precio < 0) next.precio = "El precio debe ser >= 0";
        if (values.stock < 0) next.stock = "El stock debe ser >= 0";
        return next;
    }, [values]);

    const isValid = Object.keys(errors).length === 0;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTouched({ nombre: true, sku: true, precio: true, stock: true });
        if (!isValid) return;
        onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="product-nombre" className="block text-sm font-medium text-slate-700">
                    Nombre
                </label>
                <input
                    id="product-nombre"
                    type="text"
                    value={values.nombre}
                    onChange={(event) => setValues({ ...values, nombre: event.target.value })}
                    onBlur={() => setTouched({ ...touched, nombre: true })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                />
                {touched.nombre && errors.nombre && (
                    <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
                )}
            </div>

            <div>
                <label htmlFor="product-sku" className="block text-sm font-medium text-slate-700">
                    SKU
                </label>
                <input
                    id="product-sku"
                    type="text"
                    value={values.sku}
                    onChange={(event) => setValues({ ...values, sku: event.target.value })}
                    onBlur={() => setTouched({ ...touched, sku: true })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                />
                {touched.sku && errors.sku && (
                    <p className="mt-1 text-xs text-red-600">{errors.sku}</p>
                )}
            </div>

            <div>
                <label htmlFor="product-categoria" className="block text-sm font-medium text-slate-700">
                    Categoría
                </label>
                <input
                    id="product-categoria"
                    type="text"
                    value={values.categoria}
                    onChange={(event) => setValues({ ...values, categoria: event.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ej: Bebidas"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="product-precio" className="block text-sm font-medium text-slate-700">
                        Precio
                    </label>
                    <input
                        id="product-precio"
                        type="number"
                        min={0}
                        value={values.precio}
                        onChange={(event) => setValues({ ...values, precio: Number(event.target.value) })}
                        onBlur={() => setTouched({ ...touched, precio: true })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    {touched.precio && errors.precio && (
                        <p className="mt-1 text-xs text-red-600">{errors.precio}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="product-stock" className="block text-sm font-medium text-slate-700">
                        Stock
                    </label>
                    <input
                        id="product-stock"
                        type="number"
                        min={0}
                        value={values.stock}
                        onChange={(event) => setValues({ ...values, stock: Number(event.target.value) })}
                        onBlur={() => setTouched({ ...touched, stock: true })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    {touched.stock && errors.stock && (
                        <p className="mt-1 text-xs text-red-600">{errors.stock}</p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="product-descripcion" className="block text-sm font-medium text-slate-700">
                    Descripción (opcional)
                </label>
                <textarea
                    id="product-descripcion"
                    value={values.descripcion}
                    onChange={(event) => setValues({ ...values, descripcion: event.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="product-activo"
                    type="checkbox"
                    checked={values.activo}
                    onChange={(event) => setValues({ ...values, activo: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="product-activo" className="text-sm font-medium text-slate-700">
                    Activo
                </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    Guardar
                </button>
            </div>
        </form>
    );
}