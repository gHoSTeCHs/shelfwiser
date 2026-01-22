import React, { useEffect, useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    X,
} from 'lucide-react';
import { Toast as ToastType } from '@/types/toast';

interface ToastProps {
    toast: ToastType;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (toast.duration > 0) {
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    const newProgress = prev - (100 / (toast.duration / 50));
                    return newProgress > 0 ? newProgress : 0;
                });
            }, 50);

            const timer = setTimeout(() => {
                handleDismiss();
            }, toast.duration);

            return () => {
                clearInterval(progressInterval);
                clearTimeout(timer);
            };
        }
    }, [toast.duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(toast.id);
        }, 300);
    };

    const getVariantStyles = () => {
        switch (toast.variant) {
            case 'success':
                return {
                    container:
                        'bg-success-50 border-success-200 dark:bg-success-950/50 dark:border-success-800',
                    icon: 'text-success-600 dark:text-success-400',
                    text: 'text-success-800 dark:text-success-200',
                    progress: 'bg-success-500 dark:bg-success-400',
                    close: 'text-success-600 hover:text-success-700 dark:text-success-400 dark:hover:text-success-300',
                };
            case 'error':
                return {
                    container:
                        'bg-error-50 border-error-200 dark:bg-error-950/50 dark:border-error-800',
                    icon: 'text-error-600 dark:text-error-400',
                    text: 'text-error-800 dark:text-error-200',
                    progress: 'bg-error-500 dark:bg-error-400',
                    close: 'text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300',
                };
            case 'warning':
                return {
                    container:
                        'bg-warning-50 border-warning-200 dark:bg-warning-950/50 dark:border-warning-800',
                    icon: 'text-warning-600 dark:text-warning-400',
                    text: 'text-warning-800 dark:text-warning-200',
                    progress: 'bg-warning-500 dark:bg-warning-400',
                    close: 'text-warning-600 hover:text-warning-700 dark:text-warning-400 dark:hover:text-warning-300',
                };
            case 'info':
            default:
                return {
                    container:
                        'bg-blue-light-50 border-blue-light-200 dark:bg-blue-light-950/50 dark:border-blue-light-800',
                    icon: 'text-blue-light-600 dark:text-blue-light-400',
                    text: 'text-blue-light-800 dark:text-blue-light-200',
                    progress: 'bg-blue-light-500 dark:bg-blue-light-400',
                    close: 'text-blue-light-600 hover:text-blue-light-700 dark:text-blue-light-400 dark:hover:text-blue-light-300',
                };
        }
    };

    const getIcon = () => {
        const iconClassName = 'h-5 w-5 flex-shrink-0';
        switch (toast.variant) {
            case 'success':
                return <CheckCircle2 className={iconClassName} />;
            case 'error':
                return <XCircle className={iconClassName} />;
            case 'warning':
                return <AlertTriangle className={iconClassName} />;
            case 'info':
            default:
                return <Info className={iconClassName} />;
        }
    };

    const styles = getVariantStyles();

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`
                relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-theme-lg
                transition-all duration-300 ease-in-out
                ${styles.container}
                ${
                    isExiting
                        ? 'opacity-0 translate-x-full'
                        : 'opacity-100 translate-x-0'
                }
            `}
        >
            {/* Icon */}
            <div className={styles.icon}>{getIcon()}</div>

            {/* Message */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${styles.text}`}>
                    {toast.message}
                </p>
            </div>

            {/* Close Button */}
            {toast.dismissible && (
                <button
                    type="button"
                    onClick={handleDismiss}
                    className={`
                        flex-shrink-0 rounded-md p-1 transition-colors
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${styles.close}
                    `}
                    aria-label="Dismiss notification"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            {/* Progress Bar */}
            {toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg bg-gray-200/30 dark:bg-gray-700/30">
                    <div
                        className={`h-full transition-all duration-100 ease-linear ${styles.progress}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default Toast;
