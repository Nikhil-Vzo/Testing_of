import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertOctagon, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto
              flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur-md border border-opacity-20
              animate-slideIn relative overflow-hidden min-w-[300px] max-w-sm
              ${toast.type === 'success' ? 'bg-green-900/80 border-green-500 text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-900/80 border-red-500 text-red-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-900/80 border-blue-500 text-blue-100' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500 text-yellow-100' : ''}
            `}
                    >
                        {/* Icon */}
                        <div className="mt-0.5 shrink-0">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                            {toast.type === 'error' && <AlertOctagon className="w-5 h-5 text-red-400" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <p className="text-sm font-medium leading-tight">{toast.message}</p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="mt-0.5 shrink-0 hover:opacity-70 transition-opacity"
                        >
                            <X className="w-4 h-4 opacity-50" />
                        </button>

                        {/* Progress Bar (Optional visual flair) */}
                        {toast.duration && toast.duration > 0 && (
                            <div
                                className={`absolute bottom-0 left-0 h-0.5 w-full bg-current opacity-20`}
                                style={{
                                    animation: `shrink ${toast.duration}ms linear forwards`
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
