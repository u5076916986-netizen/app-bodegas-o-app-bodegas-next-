"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { read, utils } from "xlsx";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ImportRow {
    nombre?: string;
    categoria?: string;
    precio?: string | number;
    sku?: string;
    stock?: string | number;
    descripcion?: string;
    imagenUrl?: string;
    estado?: string;
    _error?: string;
    _ok?: boolean;
}

interface DashboardActionsProps {
    bodegaId: string;
}

// ──────────────────────────────────────────────
// Modal wrapper
// ──────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-700 leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Modal: Nuevo Producto
// ──────────────────────────────────────────────
function NuevoProductoModal({ open, onClose, bodegaId }: { open: boolean; onClose: () => void; bodegaId: string }) {
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [form, setForm] = useState({
        nombre: "", categoria: "", precio: "", sku: "",
        stock: "", descripcion: "", imagenUrl: "", estado: "activo",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, bodegaId }),
            });
            const data = await res.json();
            if (data.ok) {
                setMsg({ ok: true, text: "Producto creado correctamente." });
                setForm({ nombre: "", categoria: "", precio: "", sku: "", stock: "", descripcion: "", imagenUrl: "", estado: "activo" });
            } else {
                setMsg({ ok: false, text: data.error || "Error al crear producto." });
            }
        } catch {
            setMsg({ ok: false, text: "Error de red." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Nuevo producto">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} required
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                        <input name="categoria" value={form.categoria} onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio *</label>
                        <input name="precio" value={form.precio} onChange={handleChange} required type="number" min="0" step="0.01"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                        <input name="sku" value={form.sku} onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                        <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                        <select name="estado" value={form.estado} onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="agotado">Agotado</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">URL de imagen</label>
                    <input name="imagenUrl" value={form.imagenUrl} onChange={handleChange} placeholder="https://..."
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {msg && (
                    <p className={`text-sm rounded px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>
                )}
                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                        {saving ? "Guardando..." : "Guardar producto"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ──────────────────────────────────────────────
// Modal: Importar Excel
// ──────────────────────────────────────────────
function ImportarExcelModal({ open, onClose, bodegaId }: { open: boolean; onClose: () => void; bodegaId: string }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [progress, setProgress] = useState<number | null>(null);
    const [results, setResults] = useState<{ ok: number; err: number } | null>(null);

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = ev.target?.result;
            const wb = read(data, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json: ImportRow[] = utils.sheet_to_json(ws);
            setRows(json);
            setResults(null);
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (!rows.length) return;
        setProgress(0);
        let ok = 0;
        let err = 0;
        const updated: ImportRow[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const res = await fetch("/api/productos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: row.nombre,
                        categoria: row.categoria,
                        precio: row.precio,
                        sku: row.sku,
                        stock: row.stock,
                        descripcion: row.descripcion,
                        imagenUrl: row.imagenUrl,
                        estado: row.estado || "activo",
                        bodegaId,
                    }),
                });
                const data = await res.json();
                if (data.ok) { ok++; updated.push({ ...row, _ok: true }); }
                else { err++; updated.push({ ...row, _error: data.error || "Error" }); }
            } catch {
                err++;
                updated.push({ ...row, _error: "Error de red" });
            }
            setProgress(Math.round(((i + 1) / rows.length) * 100));
        }

        setRows(updated);
        setResults({ ok, err });
    };

    const handleClose = () => {
        setRows([]);
        setProgress(null);
        setResults(null);
        if (fileRef.current) fileRef.current.value = "";
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} title="Importar desde Excel / CSV">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    El archivo debe tener columnas: <code className="bg-gray-100 px-1 rounded">nombre, categoria, precio, sku, stock, descripcion, imagenUrl, estado</code>
                </p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />

                {rows.length > 0 && progress === null && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{rows.length} filas detectadas</p>
                        <div className="max-h-40 overflow-y-auto rounded border text-xs">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-1 text-left">Nombre</th>
                                        <th className="px-2 py-1 text-left">Precio</th>
                                        <th className="px-2 py-1 text-left">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="px-2 py-1">{r.nombre}</td>
                                            <td className="px-2 py-1">{r.precio}</td>
                                            <td className="px-2 py-1">{r.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {progress !== null && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Importando...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {results && (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-green-700">{results.ok} importados correctamente</p>
                        {results.err > 0 && <p className="text-sm font-semibold text-red-600">{results.err} con errores</p>}
                        <div className="max-h-32 overflow-y-auto space-y-1">
                            {rows.filter(r => r._error).map((r, i) => (
                                <p key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                                    <strong>{r.nombre}</strong>: {r._error}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <button onClick={handleClose}
                        className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cerrar
                    </button>
                    <button onClick={handleImport} disabled={!rows.length || progress !== null}
                        className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                        {progress !== null ? `${progress}%` : "Importar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ──────────────────────────────────────────────
// Modal: Crear Promoción
// ──────────────────────────────────────────────
function CrearPromocionModal({ open, onClose, bodegaId }: { open: boolean; onClose: () => void; bodegaId: string }) {
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [form, setForm] = useState({
        titulo: "", descripcion: "", tipo: "porcentaje", valor: "",
        fechaInicio: "", fechaFin: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/promociones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titulo: form.titulo,
                    descripcion: form.descripcion || undefined,
                    tipo: form.tipo,
                    valor: form.valor,
                    bodegaId,
                    fechaInicio: form.fechaInicio || undefined,
                    fechaFin: form.fechaFin || undefined,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setMsg({ ok: true, text: "Promoción creada correctamente." });
                setForm({ titulo: "", descripcion: "", tipo: "porcentaje", valor: "", fechaInicio: "", fechaFin: "" });
            } else {
                setMsg({ ok: false, text: data.error || "Error al crear promoción." });
            }
        } catch {
            setMsg({ ok: false, text: "Error de red." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Crear promoción">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                    <input name="titulo" value={form.titulo} onChange={handleChange} required
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                        <select name="tipo" value={form.tipo} onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="porcentaje">Porcentaje (%)</option>
                            <option value="monto">Monto fijo ($)</option>
                            <option value="2x1">2x1</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Descuento *</label>
                        <input name="valor" value={form.valor} onChange={handleChange} required type="number" min="0" step="0.01"
                            placeholder={form.tipo === "porcentaje" ? "ej: 15" : "ej: 5000"}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio</label>
                        <input name="fechaInicio" value={form.fechaInicio} onChange={handleChange} type="date"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin</label>
                        <input name="fechaFin" value={form.fechaFin} onChange={handleChange} type="date"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {msg && (
                    <p className={`text-sm rounded px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>
                )}
                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                        {saving ? "Guardando..." : "Crear promoción"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────
export default function DashboardActions({ bodegaId }: DashboardActionsProps) {
    const [modal, setModal] = useState<"producto" | "excel" | "promo" | null>(null);

    const actions = [
        { label: "Nuevo producto", emoji: "➕", onClick: () => setModal("producto") },
        { label: "Importar Excel", emoji: "📥", onClick: () => setModal("excel") },
        { label: "Crear promoción", emoji: "🎯", onClick: () => setModal("promo") },
        { label: "Ver pedidos", emoji: "👁️", href: `/bodega/${bodegaId}/pedidos` },
        { label: "Ver clientes", emoji: "👥", href: `/bodega/${bodegaId}/clientes` },
    ];

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {actions.map((action) =>
                    action.href ? (
                        <a
                            key={action.label}
                            href={action.href}
                            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <span className="text-2xl md:text-3xl mb-1">{action.emoji}</span>
                            <span className="text-xs md:text-sm font-medium text-gray-700 text-center">{action.label}</span>
                        </a>
                    ) : (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <span className="text-2xl md:text-3xl mb-1">{action.emoji}</span>
                            <span className="text-xs md:text-sm font-medium text-gray-700 text-center">{action.label}</span>
                        </button>
                    )
                )}
            </div>

            <NuevoProductoModal open={modal === "producto"} onClose={() => setModal(null)} bodegaId={bodegaId} />
            <ImportarExcelModal open={modal === "excel"} onClose={() => setModal(null)} bodegaId={bodegaId} />
            <CrearPromocionModal open={modal === "promo"} onClose={() => setModal(null)} bodegaId={bodegaId} />
        </>
    );
}
