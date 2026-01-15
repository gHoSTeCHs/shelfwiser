import Button from '@/components/ui/button/Button';
import { ErrorFallbackProps } from '@/types/error';
import { Cloud, CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface NetworkErrorFallbackProps extends ErrorFallbackProps {
    /** Custom class name */
    className?: string;
    /** Enable exponential backoff retry */
    useBackoff?: boolean;
    /** Initial retry delay in ms */
    initialRetryDelay?: number;
    /** Maximum retry delay in ms */
    maxRetryDelay?: number;
    /** Maximum number of retries before giving up */
    maxRetries?: number;
    /** Inline mode (smaller, fits within content) */
    inline?: boolean;
}

/**
 * NetworkErrorFallback - Specialized fallback for network/API errors
 *
 * This component handles:
 * - Failed API requests
 * - Fetch errors
 * - Server connection issues
 *
 * Features:
 * - Real-time online/offline detection
 * - Exponential backoff retry
 * - Auto-retry when connection is restored
 * - Inline and full-page variants
 */
const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({
    error,
    errorInfo,
    resetError,
    isResetting = false,
    className = '',
    useBackoff = true,
    initialRetryDelay = 1000,
    maxRetryDelay = 30000,
    maxRetries = 5,
    inline = false,
}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [retryCount, setRetryCount] = useState(0);
    const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
    const [isAutoRetrying, setIsAutoRetrying] = useState(false);

    // Calculate next retry delay with exponential backoff
    const getRetryDelay = useCallback(
        (attempt: number): number => {
            if (!useBackoff) return initialRetryDelay;
            const delay = Math.min(
                initialRetryDelay * Math.pow(2, attempt),
                maxRetryDelay,
            );
            // Add jitter (±20%)
            const jitter = delay * 0.2 * (Math.random() * 2 - 1);
            return Math.round(delay + jitter);
        },
        [useBackoff, initialRetryDelay, maxRetryDelay],
    );

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-retry when back online
            if (retryCount < maxRetries) {
                handleRetry();
            }
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [retryCount, maxRetries]);

    // Countdown timer for next retry
    useEffect(() => {
        if (nextRetryIn === null || nextRetryIn <= 0) return;

        const interval = setInterval(() => {
            setNextRetryIn((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [nextRetryIn]);

    // Auto-retry when countdown reaches 0
    useEffect(() => {
        if (nextRetryIn === 0 && isOnline && !isAutoRetrying) {
            handleRetry();
        }
    }, [nextRetryIn, isOnline, isAutoRetrying]);

    const handleRetry = useCallback(() => {
        if (retryCount >= maxRetries) return;

        setIsAutoRetrying(true);
        setRetryCount((prev) => prev + 1);

        resetError();

        // If retry fails, schedule next attempt
        setTimeout(() => {
            setIsAutoRetrying(false);
        }, 500);
    }, [retryCount, maxRetries, resetError]);

    const handleManualRetry = () => {
        setRetryCount(0);
        setNextRetryIn(null);
        resetError();
    };

    const scheduleRetry = () => {
        const delay = getRetryDelay(retryCount);
        setNextRetryIn(Math.ceil(delay / 1000));
    };

    // Inline variant
    if (inline) {
        return (
            <div
                className={`flex items-center gap-3 rounded-xl border border-warning-500 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/15 ${className} `}
                role="alert"
            >
                <div className="flex-shrink-0">
                    {isOnline ? (
                        <Cloud className="h-5 w-5 text-warning-500" />
                    ) : (
                        <CloudOff className="h-5 w-5 text-error-500" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {isOnline ? 'Connection issue' : "You're offline"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {isOnline
                            ? 'Unable to reach the server. Please try again.'
                            : 'Check your internet connection.'}
                    </p>
                </div>

                {isOnline && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualRetry}
                        disabled={isResetting || isAutoRetrying}
                        loading={isResetting || isAutoRetrying}
                        startIcon={
                            !isResetting && !isAutoRetrying ? (
                                <RefreshCw className="h-3 w-3" />
                            ) : undefined
                        }
                    >
                        Retry
                    </Button>
                )}
            </div>
        );
    }

    // Full-page variant
    return (
        <div
            className={`flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8 dark:bg-gray-900 ${className} `}
        >
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-md sm:p-8 dark:border-gray-800 dark:bg-white/[0.03]">
                    {/* Icon */}
                    <div
                        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20 ${
                            isOnline
                                ? 'bg-warning-50 dark:bg-warning-500/15'
                                : 'bg-error-50 dark:bg-error-500/15'
                        } `}
                    >
                        {isOnline ? (
                            <Cloud className="h-8 w-8 text-warning-500 sm:h-10 sm:w-10" />
                        ) : (
                            <WifiOff className="h-8 w-8 text-error-500 sm:h-10 sm:w-10" />
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="mb-3 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
                        {isOnline ? 'Connection Problem' : "You're Offline"}
                    </h1>

                    {/* Description */}
                    <p className="mb-6 text-sm leading-relaxed text-gray-500 sm:text-base dark:text-gray-400">
                        {isOnline
                            ? "We couldn't connect to the server. This might be a temporary issue."
                            : 'Please check your internet connection and try again.'}
                    </p>

                    {/* Retry Info */}
                    {isOnline && retryCount > 0 && retryCount < maxRetries && (
                        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            {nextRetryIn !== null && nextRetryIn > 0 ? (
                                <p>
                                    Retrying in {nextRetryIn}s... (Attempt{' '}
                                    {retryCount}/{maxRetries})
                                </p>
                            ) : (
                                <p>
                                    Attempt {retryCount} of {maxRetries} failed
                                </p>
                            )}
                        </div>
                    )}

                    {/* Max retries reached */}
                    {retryCount >= maxRetries && (
                        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">
                            Maximum retry attempts reached. Please try again
                            later or contact support.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Button
                            variant="primary"
                            onClick={handleManualRetry}
                            disabled={
                                isResetting || isAutoRetrying || !isOnline
                            }
                            loading={isResetting || isAutoRetrying}
                            startIcon={
                                !isResetting && !isAutoRetrying ? (
                                    <RefreshCw className="h-4 w-4" />
                                ) : undefined
                            }
                        >
                            {isResetting || isAutoRetrying
                                ? 'Retrying...'
                                : 'Try Again'}
                        </Button>

                        {retryCount < maxRetries &&
                            isOnline &&
                            !nextRetryIn && (
                                <Button
                                    variant="outline"
                                    onClick={scheduleRetry}
                                >
                                    Schedule Retry
                                </Button>
                            )}
                    </div>

                    {/* Error ID */}
                    {errorInfo.errorId && (
                        <p className="font-mono mt-6 text-xs text-gray-400 dark:text-gray-500">
                            Error ID: {errorInfo.errorId}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkErrorFallback;
