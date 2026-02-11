"use client";

import { useEffect, useState } from "react";

type IaConfig = {
  ia_enabled: boolean;
  system_prompt: string;
  analysis_goals: string[];
};

export default function AdminIaPage() {
  const [config, setConfig] = useState<IaConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/ia-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setConfig(data.config);
      });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/ia-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage("Configuración guardada.");
      setConfig(data.config);
    } else {
      setMessage(data.error || "No se pudo guardar.");
    }
    setSaving(false);
  };

  if (!config) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-sm text-slate-500">Cargando configuración IA…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Admin IA</p>
        <h1 className="text-3xl font-semibold text-slate-900">Configuración inteligente</h1>
        <p className="text-sm text-slate-600">
          Ajusta el prompt y los objetivos que usan los endpoints de IA. Activa o desactiva el análisis cuando quieras.
        </p>
      </header>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={config.ia_enabled}
            onChange={(event) => setConfig({ ...config, ia_enabled: event.target.checked })}
          />
          IA habilitada
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Prompt de sistema
          <textarea
            value={config.system_prompt}
            onChange={(event) => setConfig({ ...config, system_prompt: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            rows={4}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Objetivos de análisis
          <textarea
            value={config.analysis_goals.join("\n")}
            onChange={(event) =>
              setConfig({
                ...config,
                analysis_goals: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
              })
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            rows={4}
          />
          <p className="text-xs text-slate-500 mt-1">Un objetivo por línea.</p>
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-[color:var(--brand-primary)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </section>
    </main>
  );
}
