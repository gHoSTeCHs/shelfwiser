import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ErrorFallbackProps } from '@/types/error';
import Button from '@/components/ui/button/Button';

interface ChunkLoadErrorFallbackProps extends Omit<ErrorFallbackProps, 'errorInfo'> {
    /** Custom class name */
    className?: string;
    /** Auto-retry after a delay (in ms) */
    autoRetryDelay?: number;
    /** Maximum auto-retry attempts */
    maxAutoRetries?: number;
}

/**
 * ChunkLoadErrorFallback - Specialized fallback for lazy-loading failures
 *
 * This component handles errors that occur when:
 * - Dynamic imports fail to load
 * - Code-splitting chunks can't be fetched
 * - CSS preloading fails
 *
 * Features:
 * - Online/offline detection
 * - Auto-retry with countdown
 * - Clear explanation for users
 * - Full page reload option
 */
const ChunkLoadErrorFallback: React.FC<ChunkLoadErrorFallbackProps> = ({
    error,
    resetError,
    isResetting = false,
    className = '',
    autoRetryDelay = 5000,
    maxAutoRetries = 2,
}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [autoRetryCount, setAutoRetryCount] = useState(0);
    const [countdown, setCountdown] = useState(autoRetryDelay / 1000);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-retry logic
    useEffect(() => {
        if (!isOnline || autoRetryCount >= maxAutoRetries) return;

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const retryTimeout = setTimeout(() => {
            setAutoRetryCount((prev) => prev + 1);
            setCountdown(autoRetryDelay / 1000);
            window.location.reload();
        }, autoRetryDelay);

        return () => {
            clearInterval(countdownInterval);
            clearTimeout(retryTimeout);
        };
    }, [isOnline, autoRetryCount, autoRetryDelay, maxAutoRetries]);

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div
            className={`
                min-h-screen flex items-center justify-center
                bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8
                ${className}
            `}
        >
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 sm:p-8 text-center shadow-theme-md">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-500/15">
                        <Download className="h-8 w-8 sm:h-10 sm:w-10 text-warning-500" />
                    </div>

                    {/* Title */}
                    <h1 className="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                        Failed to Load Page
                    </h1>

                    {/* Description */}
                    <p className="mb-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                        A part of this page couldn't be loaded. This usually happens due to a network issue or a recent update.
                    </p>

                    {/* Online/Offline Status */}
                    <div className={`
                        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6
                        ${isOnline
                            ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                            : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400'
                        }
                    `}>
                        {isOnline ? (
                            <>
                                <Wifi className="h-3 w-3" />
                                <span>You're online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-3 w-3" />
                                <span>You're offline</span>
                            </>
                        )}
                    </div>

                    {/* Auto-retry countdown */}
                    {isOnline && autoRetryCount < maxAutoRetries && countdown > 0 && (
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            Retrying automatically in {countdown}s...
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            variant="primary"
                            onClick={handleReload}
                            disabled={isResetting}
                            loading={isResetting}
                            startIcon={!isResetting ? <RefreshCw className="h-4 w-4" /> : undefined}
                        >
                            Refresh Page
                        </Button>
                    </div>

                    {/* Hint for users */}
                    <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                        If you recently updated the app, refreshing should fix this issue.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChunkLoadErrorFallback;
