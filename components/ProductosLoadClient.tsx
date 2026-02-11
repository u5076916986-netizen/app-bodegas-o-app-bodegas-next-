"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductImportReview, { type FotoProducto } from "@/components/ProductImportReview";
import {
    applyMappingAndValidate,
    buildErrorsCSV,
    buildTemplateCSV,
    parseCSVText,
    parsePastedList,
    parseXLSXFile,
    type HeaderMapping,
    type ImportResult,
    type ParsedProducto,
} from "@/lib/productImport";

interface ProductosLoadClientProps {
    bodegaId: string;
}

type PreviewRow = {
    rowIndex: number;
    status: "ok" | "warning" | "error";
    producto: Partial<ParsedProducto>;
    errors?: string[];
    warnings?: string[];
};

export default function ProductosLoadClient({ bodegaId }: ProductosLoadClientProps) {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<"excel" | "paste" | "foto">("excel");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [mapping, setMapping] = useState<HeaderMapping>({});
    const [fileData, setFileData] = useState<ParsedProducto[]>([]);
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
    const [pasteText, setPasteText] = useState("");
    const [showExample, setShowExample] = useState(false);
    const [fotoProducts, setFotoProducts] = useState<FotoProducto[]>([]);
    const [fotoLoading, setFotoLoading] = useState(false);
    const [fotoError, setFotoError] = useState<string | null>(null);
    const showQaTemplate = searchParams.get("qaTemplate") === "1";

    const updateFromResult = (result: ImportResult) => {
        setImportResult(result);
        setMapping(result.mapping);
        setFileData(result.validProducts);
        setPreviewRows(buildPreviewRows(result, result.mapping));
    };

    const buildPreviewRows = (result: ImportResult, activeMapping: HeaderMapping): PreviewRow[] => {
        const invalidMap = new Map<number, string[]>();
        result.invalidDetails.forEach((detail) => {
            invalidMap.set(detail.rowIndex, detail.errors);
        });
        return result.rows.slice(0, 20).map((row, index) => {
            const rowIndex = index + 1;
            const errors = invalidMap.get(rowIndex);
            const warnings: string[] = [];
            const descripcion = String(row[activeMapping.descripcion || ""] ?? "").trim();
            const stock = Number(row[activeMapping.stock || ""] ?? 0);
            if (!descripcion) warnings.push("Descripción vacía");
            if (Number.isFinite(stock) && stock === 0) warnings.push("Stock en 0");
            return {
                rowIndex,
                status: errors ? "error" : warnings.length > 0 ? "warning" : "ok",
                errors,
                warnings,
                producto: {
                    nombre: String(row[activeMapping.nombre || ""] ?? "").trim(),
                    sku: String(row[activeMapping.sku || ""] ?? "").trim(),
                    categoria: String(row[activeMapping.categoria || ""] ?? "").trim(),
                    precio: Number(row[activeMapping.precio || ""] ?? 0),
                    stock: Number(row[activeMapping.stock || ""] ?? 0),
                    descripcion,
                },
            };
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setError(null);
            setSuccess(null);
            let result: ImportResult;
            if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
                result = await parseXLSXFile(file);
            } else {
                const text = await file.text();
                result = await parseCSVText(text);
            }

            if (result.totalRows === 0) {
                setError("No se encontraron filas en el archivo.");
                return;
            }

            updateFromResult(result);
        } catch (err) {
            setError("Error al procesar el archivo");
        }
    };

    const handlePasteList = () => {
        try {
            setError(null);
            setSuccess(null);

            if (!pasteText.trim()) {
                setImportResult(null);
                setFileData([]);
                setPreviewRows([]);
                return;
            }

            const result = parsePastedList(pasteText);
            updateFromResult(result);
        } catch (err) {
            setError("Error al procesar el texto");
        }
    };

    const handleImport = async () => {
        if (fileData.length === 0) {
            setError("No hay productos válidos para importar");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/productos/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bodegaId,
                    productos: fileData,
                }),
            });

            const result = await response.json();

            if (result.ok) {
                setSuccess(`${result.data.imported} productos importados exitosamente`);
                setFileData([]);
                setImportResult(null);
                setPreviewRows([]);
                setPasteText("");
            } else {
                setError(result.error || "Error importando productos");
            }
        } catch (err) {
            setError("Error importando productos");
        } finally {
            setLoading(false);
        }
    };

    const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setFotoError(null);
            setFotoLoading(true);
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`/api/productos/importar-foto?bodegaId=${bodegaId}`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (!response.ok || !result.ok) {
                setFotoError(result.error || "No se pudo procesar la imagen");
                setFotoProducts([]);
                return;
            }

            const productos = (result.productos || []).map((prod: any) => ({
                nombre: String(prod.nombre ?? "").trim(),
                sku: String(prod.sku ?? "").trim(),
                categoria: String(prod.categoria ?? "").trim(),
                precio: Number(prod.precio_cop ?? prod.precio ?? 0),
                stock: Number(prod.stock ?? 0),
                unidad: String(prod.unidad ?? "unidad").trim(),
                confidence: typeof prod.confidence === "number" ? prod.confidence : undefined,
            })) as FotoProducto[];

            setFotoProducts(productos);
        } catch (err) {
            setFotoError("Error al subir la imagen");
        } finally {
            setFotoLoading(false);
        }
    };

    const saveFotoProducts = async (productsToSave: FotoProducto[]) => {
        try {
            setLoading(true);
            setFotoError(null);

            const response = await fetch("/api/bodega/importar-productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bodegaId,
                    productos: productsToSave.map((prod) => ({
                        nombre: prod.nombre,
                        categoria: prod.categoria,
                        precio_cop: Number(prod.precio ?? 0),
                        stock: Number(prod.stock ?? 0),
                    })),
                }),
            });

            const result = await response.json();
            if (result.ok) {
                setSuccess(result.message || "Catálogo guardado exitosamente");
                setFotoProducts([]);
            } else {
                setFotoError(result.error || "No se pudo guardar el catálogo");
            }
        } catch (err) {
            setFotoError("Error al guardar el catálogo");
        } finally {
            setLoading(false);
        }
    };

    const handleFotoSaveAll = (products: FotoProducto[]) => {
        if (products.length === 0) {
            setFotoError("No hay productos detectados para guardar");
            return;
        }
        void saveFotoProducts(products);
    };

    const handleFotoSaveValid = (products: FotoProducto[]) => {
        if (products.length === 0) {
            setFotoError("No hay productos válidos para guardar");
            return;
        }
        void saveFotoProducts(products);
    };

    const handleMappingChange = (field: keyof HeaderMapping, value: string) => {
        const next = { ...mapping, [field]: value || undefined };
        setMapping(next);
        if (importResult) {
            const updated = applyMappingAndValidate(importResult.rows, next);
            setImportResult(updated);
            setFileData(updated.validProducts);
            setPreviewRows(buildPreviewRows(updated, next));
        }
    };

    const errorSummary = useMemo(() => {
        if (!importResult?.invalidDetails.length) return [] as Array<{ error: string; count: number }>;
        const counts = new Map<string, number>();
        importResult.invalidDetails.forEach((detail) => {
            detail.errors.forEach((err) => {
                counts.set(err, (counts.get(err) || 0) + 1);
            });
        });
        return Array.from(counts.entries())
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count);
    }, [importResult]);

    const diagnostics = useMemo(() => {
        if (!importResult) return [] as string[];
        const issues: string[] = [];
        const requiredFields: (keyof HeaderMapping)[] = [
            "nombre",
            "sku",
            "categoria",
            "precio",
            "stock",
        ];
        const missingFields = requiredFields.filter((field) => !mapping[field]);
        if (missingFields.length > 0) {
            issues.push(`Faltan columnas requeridas: ${missingFields.join(", ")}.`);
        }
        const emptyRows = importResult.invalidDetails.filter((detail) =>
            Object.values(detail.rawRow || {}).every((value) => String(value ?? "").trim() === ""),
        ).length;
        if (emptyRows > 0) {
            issues.push(`Filas vacías detectadas: ${emptyRows}.`);
        }
        const invalidPrice = importResult.invalidDetails.filter((detail) =>
            detail.errors.includes("Precio inválido"),
        ).length;
        if (invalidPrice > 0) {
            issues.push(`Precios inválidos: ${invalidPrice}.`);
        }
        const missingNombre = importResult.invalidDetails.filter((detail) =>
            detail.errors.includes("Nombre requerido"),
        ).length;
        if (missingNombre > 0) {
            issues.push(`Filas sin nombre: ${missingNombre}.`);
        }
        const missingSku = importResult.invalidDetails.filter((detail) =>
            detail.errors.includes("SKU requerido"),
        ).length;
        if (missingSku > 0) {
            issues.push(`Filas sin SKU: ${missingSku}.`);
        }
        const missingCategoria = importResult.invalidDetails.filter((detail) =>
            detail.errors.includes("Categoría requerida"),
        ).length;
        if (missingCategoria > 0) {
            issues.push(`Filas sin categoría: ${missingCategoria}.`);
        }
        if (issues.length === 0 && importResult.invalidRows > 0) {
            issues.push("Hay filas con errores de formato. Revisa el mapeo y los datos.");
        }
        return issues;
    }, [importResult, mapping]);

    const canImport = Boolean(
        importResult &&
        importResult.mappingComplete &&
        importResult.invalidRows === 0 &&
        fileData.length > 0,
    );

    const downloadCsv = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {showQaTemplate ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Plantilla de ejemplo (QA)</p>
                    <p className="text-xs text-slate-500">Puedes copiarla y pegarla en “Pegar lista”.</p>
                    <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-slate-700 border border-slate-200">
                        {buildTemplateCSV()}
                    </pre>
                </div>
            ) : null}
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                    {success}
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-slate-900">Cargar Productos</h1>
                <p className="text-sm text-slate-600 mt-2">
                    Importa productos en lote desde Excel, CSV o pegando una lista
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200" role="tablist" aria-label="Opciones de carga">
                {(["excel", "paste", "foto"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                        role="tab"
                    >
                        {tab === "excel" && "📊 Excel/CSV"}
                        {tab === "paste" && "📝 Pegar Lista"}
                        {tab === "foto" && "🖼️ Subir Fotos"}
                    </button>
                ))}
            </div>

            {/* Excel/CSV Tab */}
            {activeTab === "excel" && (
                <div className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                        </div>
                        <label htmlFor="excel-file" className="cursor-pointer">
                            <span className="text-sm font-semibold text-blue-600 hover:underline">
                                Selecciona un archivo
                            </span>
                            <input
                                id="excel-file"
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                                aria-label="Cargar archivo Excel o CSV"
                            />
                        </label>
                        <p className="mt-2 text-sm text-slate-600">
                            o arrastra un archivo aquí
                        </p>
                        <p className="mt-4 text-xs text-slate-500">
                            Columnas requeridas: nombre, sku, categoria, precio, stock, descripcion (opcional)
                        </p>
                    </div>
                    <button
                        onClick={() => downloadCsv(buildTemplateCSV(), "plantilla-productos.csv")}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Descargar plantilla CSV
                    </button>
                    <button
                        onClick={() => setShowExample((prev) => !prev)}
                        className="ml-2 inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        {showExample ? "Ocultar ejemplo" : "Ver ejemplo"}
                    </button>
                    {showExample ? (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                            <p className="font-semibold text-slate-900">Formato correcto (CSV)</p>
                            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-slate-700 border border-slate-200">
                                {buildTemplateCSV()}
                            </pre>
                        </div>
                    ) : null}
                </div>
            )}

            {activeTab === "foto" && (
                <div className="space-y-4">
                    {fotoError && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                            {fotoError}
                        </div>
                    )}
                    <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                        <p className="text-sm text-slate-600 mb-4">
                            Sube una foto de tu lista de productos y te ayudamos a generar el catálogo.
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFotoUpload}
                            aria-label="Subir foto de productos"
                            className="mx-auto block text-sm"
                        />
                        {fotoLoading ? (
                            <p className="mt-3 text-xs text-slate-500">Procesando imagen...</p>
                        ) : null}
                    </div>

                    {fotoProducts.length > 0 ? (
                        <ProductImportReview
                            initialProducts={fotoProducts}
                            loading={loading}
                            onSaveAll={handleFotoSaveAll}
                            onSaveValid={handleFotoSaveValid}
                            onDiscard={() => setFotoProducts([])}
                        />
                    ) : null}
                </div>
            )}

            {/* Pegar Lista Tab */}
            {activeTab === "paste" && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="paste-textarea" className="block text-sm font-medium text-slate-700">
                            Pega tu lista aquí
                        </label>
                        <textarea
                            id="paste-textarea"
                            value={pasteText}
                            placeholder="Nombre, Precio, Stock (separado por coma o tab)\nEjemplo:\nArroz 5kg, 18500, 50"
                            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                            rows={6}
                            onChange={(e) => setPasteText(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePasteList}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Procesar lista
                        </button>
                        <p className="text-xs text-slate-500">
                            Formato: nombre, precio, stock (separados por coma o tab, una línea por producto)
                        </p>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            {importResult && (
                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-sm text-slate-700">
                            Leí <strong>{importResult.totalRows}</strong> filas: <strong>{importResult.validRows}</strong> válidas, <strong>{importResult.invalidRows}</strong> con errores.
                        </p>
                        {importResult.invalidRows > 0 && (
                            <div className="mt-2 text-xs text-slate-500">
                                {errorSummary.slice(0, 3).map((err) => (
                                    <div key={err.error}>• {err.error}: {err.count}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    {importResult.validRows === 0 ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            <p className="font-semibold">No se encontraron productos válidos en el archivo.</p>
                            <div className="mt-2 text-xs text-red-700">
                                {diagnostics.length > 0 ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {diagnostics.map((issue) => (
                                            <li key={issue}>{issue}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Revisa el formato y el mapeo de columnas.</p>
                                )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    onClick={() => downloadCsv(buildTemplateCSV(), "plantilla-productos.csv")}
                                    className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                    Descargar plantilla CSV
                                </button>
                                <button
                                    onClick={() => setShowExample(true)}
                                    className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                    Ver ejemplo
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {!importResult.mappingComplete && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <h3 className="text-sm font-semibold text-amber-800">Mapeo de columnas</h3>
                            <p className="text-xs text-amber-700 mt-1">Asocia las columnas del archivo con los campos requeridos.</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {(["nombre", "sku", "categoria", "precio", "stock", "descripcion"] as const).map((field) => (
                                    <div key={field} className="space-y-1">
                                        <label htmlFor={`mapping-${field}`} className="text-xs font-semibold text-amber-800 capitalize">{field}</label>
                                        <select
                                            id={`mapping-${field}`}
                                            value={mapping[field] ?? ""}
                                            onChange={(e) => handleMappingChange(field, e.target.value)}
                                            className="w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-sm"
                                        >
                                            <option value="">Seleccionar</option>
                                            {importResult.headers.map((header) => (
                                                <option key={header} value={header}>{header}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {importResult.invalidRows > 0 && (
                        <button
                            onClick={() => downloadCsv(buildErrorsCSV(importResult.invalidDetails), "errores-importacion.csv")}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Descargar errores CSV
                        </button>
                    )}

                    <div className="overflow-x-auto rounded-md border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Fila</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Nombre</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">SKU</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Categoría</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900">Precio</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900">Stock</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row) => (
                                    <tr key={row.rowIndex} className="border-b border-slate-200 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600">{row.rowIndex}</td>
                                        <td className="px-4 py-3 text-slate-900">{row.producto.nombre}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.producto.sku}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.producto.categoria}</td>
                                        <td className="px-4 py-3 text-right text-slate-900">
                                            {Number(row.producto.precio || 0) > 0 ? `$${Number(row.producto.precio || 0).toLocaleString("es-CO")}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-900">
                                            {row.producto.stock ?? "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.status === "ok" ? (
                                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">OK</span>
                                            ) : row.status === "warning" ? (
                                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                                    {row.warnings?.[0] || "Warning"}
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                                    {row.errors?.[0] || "Error"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={loading || !canImport}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        aria-label={`Importar ${fileData.length} productos`}
                    >
                        {loading ? "Importando..." : `Importar ${fileData.length} productos`}
                    </button>
                    {!canImport && importResult.mappingComplete && importResult.invalidRows > 0 ? (
                        <p className="text-xs text-amber-700">
                            Corrige los errores antes de importar. Los warnings no bloquean el guardado.
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );
}
