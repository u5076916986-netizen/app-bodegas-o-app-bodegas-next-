"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Bodega } from "@/lib/csv";
import type { BodegaTheme } from "@/lib/themes";

type Props = {
  bodegas: Bodega[];
  themes: Record<string, BodegaTheme>;
  fallbackTheme: BodegaTheme;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatCurrency = (value: number | null) => {
  if (value === null) return "N/D";
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

export default function BodegasList({ bodegas, themes, fallbackTheme }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCiudad, setSelectedCiudad] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState(true);

  // Apply dynamic badge styles when DOM updates
  useEffect(() => {
    const badges = document.querySelectorAll<HTMLElement>(".badge-dynamic");
    badges.forEach((badge) => {
      const bg = badge.getAttribute("data-bg");
      const color = badge.getAttribute("data-color");
      if (bg) badge.style.backgroundColor = bg;
      if (color) badge.style.color = color;
    });
  }, [searchQuery, selectedCiudad, selectedCategoria, onlyActive]);

  // Extract unique values for filters
  const ciudades = useMemo(() => {
    const set = new Set(bodegas.map((b) => b.ciudad));
    return Array.from(set).sort();
  }, [bodegas]);

  const categorias = useMemo(() => {
    const set = new Set(bodegas.map((b) => b.categoria_principal));
    return Array.from(set).sort();
  }, [bodegas]);

  // Filter logic
  const filtered = useMemo(() => {
    let result = bodegas;

    // Search term
    if (searchQuery.trim()) {
      const normalizedTerm = normalize(searchQuery);
      result = result.filter((bodega) => {
        const fields = [
          bodega.nombre,
          bodega.categoria_principal,
          bodega.zona,
          bodega.ciudad,
        ];
        return fields.some((field) => normalize(field).includes(normalizedTerm));
      });
    }

    // Ciudad filter
    if (selectedCiudad) {
      result = result.filter((bodega) => bodega.ciudad === selectedCiudad);
    }

    // Categoría filter
    if (selectedCategoria) {
      result = result.filter(
        (bodega) => bodega.categoria_principal === selectedCategoria
      );
    }

    // Active only filter
    if (onlyActive) {
      result = result.filter(
        (bodega) => bodega.estado?.toLowerCase() === "activo"
      );
    }

    return result;
  }, [bodegas, searchQuery, selectedCiudad, selectedCategoria, onlyActive]);

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCiudad("");
    setSelectedCategoria("");
    setOnlyActive(true);
  };

  const hasFilters =
    searchQuery || selectedCiudad || selectedCategoria || !onlyActive;

  return (
    <div className="space-y-4">
      {/* Command Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="search-bodega" className="sr-only">
              Buscar bodega
            </label>
            <input
              id="search-bodega"
              type="text"
              placeholder="Buscar bodega, producto o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              aria-label="Limpiar filtros"
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Inline Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Ciudad */}
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="filter-ciudad" className="sr-only">
              Filtrar por ciudad
            </label>
            <select
              id="filter-ciudad"
              value={selectedCiudad}
              onChange={(e) => setSelectedCiudad(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="filter-categoria" className="sr-only">
              Filtrar por categoría
            </label>
            <select
              id="filter-categoria"
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5">
            <label htmlFor="filter-active" className="text-sm text-slate-700">
              Solo activas
            </label>
            <input
              id="filter-active"
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span>{" "}
          de <span className="font-semibold">{bodegas.length}</span> bodegas
        </p>
      </div>

      {/* Bodegas Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-600">
            No se encontraron bodegas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((bodega) => {
            const theme = themes[bodega.bodega_id] ?? fallbackTheme;
            return (
              <Link
                key={bodega.bodega_id}
                href={`/bodegas/${bodega.bodega_id}`}
                className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs transition hover:shadow-md hover:border-slate-300"
              >
                <div className="p-3">
                  {/* Header: Category + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-xs font-medium text-slate-500 truncate">
                      {bodega.categoria_principal}
                    </div>
                    <span
                      className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 badge-dynamic"
                      data-bg={theme.badgeBg}
                      data-color={theme.badgeText}
                    >
                      {bodega.estado}
                    </span>
                  </div>

                  {/* Nombre */}
                  <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-600">
                    {bodega.nombre}
                  </h3>

                  {/* Ciudad + Zona */}
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    {bodega.ciudad} • {bodega.zona}
                  </p>

                  {/* Min Pedido + Entrega en 1 fila */}
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Min:</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(bodega.min_pedido_cop)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Entrega:</p>
                      <p className="font-semibold text-slate-900">
                        {bodega.tiempo_entrega_estimado}
                      </p>
                    </div>
                  </div>

                  {/* Pago compacto */}
                  {bodega.metodos_pago && (
                    <p className="mt-2 text-xs text-slate-600 truncate">
                      💳 {bodega.metodos_pago}
                    </p>
                  )}

                  {/* Horario pequeño */}
                  {bodega.horario_texto && (
                    <p className="mt-1 text-xs text-slate-500 truncate">
                      🕐 {bodega.horario_texto}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
