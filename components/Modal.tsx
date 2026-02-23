"use client";

import React from "react";

/**
 * Componente Modal - Dialog responsive optimizado para móvil
 * 
 * Características:
 * - Full-width en pantallas pequeñas
 * - Botones con tamaño táctil adecuado
 * - Scroll interno para contenido largo
 * - Contraste de colores mejorado
 */
interface ModalProps {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    size?: "sm" | "md" | "lg" | "xl";
    confirmDisabled?: boolean;
}

export default function Modal({
    isOpen,
    title,
    children,
    onClose,
    onConfirm,
    confirmText = "Guardar",
    cancelText = "Cancelar",
    size = "md",
    confirmDisabled = false,
}: ModalProps) {
    if (!isOpen) return null;

    // Tamaños responsive - más anchos en desktop, casi full en móvil
    const sizeClass = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    }[size];

    return (
        // Overlay con padding adaptable
        <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
            onClick={onClose}
        >
            {/* Contenedor del modal - slide-up en móvil */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full ${sizeClass} max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-lg border border-[color:var(--surface-border)] bg-white text-slate-800 shadow-xl`}
            >
                {/* Header del modal */}
                <div className="border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
                    {/* Botón cerrar visible en móvil */}
                    <button
                        onClick={onClose}
                        className="sm:hidden p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Contenido con scroll */}
                <div className="px-4 sm:px-6 py-4 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-160px)] overflow-y-auto">
                    {children}
                </div>
                
                {/* Footer con botones - sticky en móvil */}
                <div className="border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] sm:min-h-0"
                    >
                        {cancelText}
                    </button>
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            disabled={confirmDisabled}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 transition-colors min-h-[44px] sm:min-h-0"
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}