import React, { createContext, useCallback, useState } from 'react';
import ToastContainer from '@/components/ui/toast/ToastContainer';
import {
    Toast,
    ToastContextType,
    ToastOptions,
    ToastPosition,
    ToastVariant,
} from '@/types/toast';

export const ToastContext = createContext<ToastContextType | undefined>(
    undefined,
);

interface ToastProviderProps {
    children: React.ReactNode;
    defaultPosition?: ToastPosition;
    defaultDuration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
    children,
    defaultPosition = 'top-right',
    defaultDuration = 5000,
}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const generateId = useCallback((): string => {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    const toast = useCallback(
        (message: string, options: ToastOptions = {}) => {
            const {
                variant = 'info',
                duration = defaultDuration,
                position = defaultPosition,
                dismissible = true,
            } = options;

            const newToast: Toast = {
                id: generateId(),
                message,
                variant,
                duration,
                position,
                dismissible,
                createdAt: Date.now(),
            };

            setToasts((prevToasts) => [...prevToasts, newToast]);
        },
        [defaultDuration, defaultPosition, generateId],
    );

    const success = useCallback(
        (message: string, options: Omit<ToastOptions, 'variant'> = {}) => {
            toast(message, { ...options, variant: 'success' });
        },
        [toast],
    );

    const error = useCallback(
        (message: string, options: Omit<ToastOptions, 'variant'> = {}) => {
            toast(message, { ...options, variant: 'error' });
        },
        [toast],
    );

    const warning = useCallback(
        (message: string, options: Omit<ToastOptions, 'variant'> = {}) => {
            toast(message, { ...options, variant: 'warning' });
        },
        [toast],
    );

    const info = useCallback(
        (message: string, options: Omit<ToastOptions, 'variant'> = {}) => {
            toast(message, { ...options, variant: 'info' });
        },
        [toast],
    );

    const value: ToastContextType = {
        toasts,
        toast,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
};
