"use client";

import { useMemo } from "react";

type Props = {
  pedidoId: string;
  url: string;
};

const GRID_SIZE = 21;

export default function QrView({ pedidoId, url }: Props) {
  const matrix = useMemo(() => {
    if (!url) return Array(GRID_SIZE * GRID_SIZE).fill(false);

    if (typeof TextEncoder === "undefined") {
      return Array(GRID_SIZE * GRID_SIZE).fill(false);
    }

    const encoder = new TextEncoder();
    const data = Array.from(encoder.encode(url));
    const bits: boolean[] = [];
    for (const byte of data) {
      for (let bit = 7; bit >= 0; bit -= 1) {
        bits.push(Boolean((byte >> bit) & 1));
      }
    }

    const size = GRID_SIZE * GRID_SIZE;
    return Array.from({ length: size }, (_, idx) => {
      return bits.length ? bits[idx % bits.length] : false;
    });
  }, [url]);

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Pedido {pedidoId}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          QR de seguimiento
        </h1>
        <p className="text-sm text-slate-600">
          Escanea para abrir el detalle del pedido.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div
          aria-label="Código QR generado con hash del pedido"
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: 220,
              height: 220,
            }}
          >
            {matrix.map((filled, idx) => (
              <span
                key={idx}
                className={`h-full w-full rounded-sm ${
                  filled ? "bg-slate-900" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-full rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 break-words">
          {url}
        </div>
      </div>
    </div>
  );
}
