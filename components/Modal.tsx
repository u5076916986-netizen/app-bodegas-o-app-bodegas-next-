"use client";

import React, { useState } from "react";

interface ModalProps {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    size?: "sm" | "md" | "lg";
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

    const sizeClass = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
    }[size];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
            <div
                className={`w-full ${sizeClass} max-h-[90vh] overflow-hidden rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-card)] text-[color:var(--text-normal)] shadow-lg`}
            >
                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>
                <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {children}
                </div>
                <div className="border-t flex justify-end gap-2 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        {cancelText}
                    </button>
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            disabled={confirmDisabled}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
