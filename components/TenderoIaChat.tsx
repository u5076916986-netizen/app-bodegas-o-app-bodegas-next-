"use client";

import { useEffect, useRef, useState } from "react";

type Mensaje = {
    rol: "user" | "assistant";
    texto: string;
};

const SUGERENCIAS = [
    "¿Qué bodegas tienen arroz?",
    "¿Cómo hago seguimiento a mi pedido?",
    "¿Hay promociones activas?",
    "¿Cómo pago con Nequi?",
];

export default function TenderoIaChat() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([
        {
            rol: "assistant",
            texto: "¡Hola! Soy tu asistente de compras 🛒 ¿En qué te puedo ayudar?",
        },
    ]);
    const [input, setInput] = useState("");
    const [cargando, setCargando] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (abierto) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [mensajes, abierto]);

    const enviar = async (texto?: string) => {
        const msg = (texto ?? input).trim();
        if (!msg || cargando) return;

        setInput("");
        setMensajes((prev) => [...prev, { rol: "user", texto: msg }]);
        setCargando(true);

        try {
            const res = await fetch("/api/ia/tendero", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg }),
            });
            const data = await res.json();

            setMensajes((prev) => [
                ...prev,
                {
                    rol: "assistant",
                    texto: data.ok
                        ? data.respuesta
                        : "Ups, tuve un problema. Intenta de nuevo.",
                },
            ]);
        } catch {
            setMensajes((prev) => [
                ...prev,
                { rol: "assistant", texto: "Sin conexión. Revisa tu internet." },
            ]);
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setAbierto((v) => !v)}
                className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform md:bottom-6 md:right-6"
                aria-label="Abrir asistente IA"
            >
                {abierto ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Ventana del chat */}
            {abierto && (
                <div className="fixed bottom-36 right-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden md:bottom-24 md:right-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
                            IA
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Asistente de compras</p>
                            <p className="text-xs text-white/80">Powered by Claude</p>
                        </div>
                        <button
                            onClick={() => setAbierto(false)}
                            className="ml-auto text-white/80 hover:text-white"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "320px" }}>
                        {mensajes.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                        m.rol === "user"
                                            ? "bg-sky-500 text-white rounded-br-none"
                                            : "bg-slate-100 text-slate-800 rounded-bl-none"
                                    }`}
                                >
                                    {m.texto}
                                </div>
                            </div>
                        ))}
                        {cargando && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-none bg-slate-100 px-4 py-2 text-sm text-slate-500">
                                    <span className="animate-pulse">Pensando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Sugerencias rápidas */}
                    {mensajes.length <= 2 && (
                        <div className="flex gap-1 overflow-x-auto px-4 pb-2">
                            {SUGERENCIAS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => enviar(s)}
                                    className="flex-shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t border-slate-100 p-3">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                enviar();
                            }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu pregunta..."
                                disabled={cargando}
                                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={cargando || !input.trim()}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 transition"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
