export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export interface ToastOptions {
    variant?: ToastVariant;
    duration?: number;
    position?: ToastPosition;
    dismissible?: boolean;
}

export interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
    duration: number;
    position: ToastPosition;
    dismissible: boolean;
    createdAt: number;
}

export interface ToastContextType {
    toasts: Toast[];
    toast: (message: string, options?: ToastOptions) => void;
    success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    error: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    warning: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    info: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}
