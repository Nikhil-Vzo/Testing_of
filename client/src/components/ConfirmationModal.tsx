import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            {/* Modal Card */}
            <div className="relative max-w-sm w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl transform transition-all scale-100">

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-neon/20 text-neon'}`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        {cancelLabel}
                    </button>

                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-white shadow-lg ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                : 'bg-neon hover:bg-neon-dark shadow-neon/20'
                            }`}
                    >
                        <Check className="w-4 h-4" />
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
