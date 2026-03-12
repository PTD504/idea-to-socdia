"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

// Glassmorphic confirmation modal replacing native window.confirm dialogs
export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // Focus the cancel button by default for safe keyboard access
            cancelRef.current?.focus();
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 backdrop-blur-md p-4"
            onClick={onCancel}
        >
            <div
                className="relative w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-gray-900 text-xl font-bold mb-3 w-full text-left tracking-tight">
                    {title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed w-full text-left mb-8">
                    {message}
                </p>
                <div className="flex justify-end w-full gap-3">
                    <button
                        ref={cancelRef}
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl border border-white/70 bg-white/70 font-semibold text-gray-700 transition-colors hover:bg-white text-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 font-semibold text-white transition-colors hover:bg-slate-800 shadow-md text-sm"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
