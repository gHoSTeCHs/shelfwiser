import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ErrorContextValue, ErrorInfo, createErrorInfo } from '@/types/error';

const MAX_ERROR_HISTORY = 10;

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

interface ErrorProviderProps {
    children: ReactNode;
    /** Maximum number of errors to keep in history */
    maxHistory?: number;
    /** External error reporter (e.g., Sentry) */
    onError?: (errorInfo: ErrorInfo) => void;
    /** Whether error reporting is enabled */
    enabled?: boolean;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({
    children,
    maxHistory = MAX_ERROR_HISTORY,
    onError,
    enabled = true,
}) => {
    const [recentErrors, setRecentErrors] = useState<ErrorInfo[]>([]);
    const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);

    const reportError = useCallback(
        (error: Error, metadata?: Record<string, unknown>) => {
            if (!enabled) return;

            const errorInfo = createErrorInfo(error, undefined, metadata);

            // Set as current error
            setCurrentError(errorInfo);

            // Add to history (keep only maxHistory items)
            setRecentErrors((prev) => {
                const newErrors = [errorInfo, ...prev].slice(0, maxHistory);
                return newErrors;
            });

            // Call external error reporter if provided
            if (onError) {
                try {
                    onError(errorInfo);
                } catch (reportingError) {
                    // Silently fail if error reporting fails
                    console.error('Error reporting failed:', reportingError);
                }
            }

            // Log to console in development
            if (import.meta.env.DEV) {
                console.group(`[ErrorContext] ${errorInfo.type} error`);
                console.error('Error:', error);
                console.info('Error Info:', errorInfo);
                console.groupEnd();
            }
        },
        [enabled, maxHistory, onError]
    );

    const clearError = useCallback(() => {
        setCurrentError(null);
    }, []);

    const clearAllErrors = useCallback(() => {
        setCurrentError(null);
        setRecentErrors([]);
    }, []);

    const value = useMemo<ErrorContextValue>(
        () => ({
            reportError,
            clearError,
            clearAllErrors,
            recentErrors,
            currentError,
            isEnabled: enabled,
        }),
        [reportError, clearError, clearAllErrors, recentErrors, currentError, enabled]
    );

    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

/**
 * Hook to access error context
 * @throws Error if used outside of ErrorProvider
 */
export const useErrorContext = (): ErrorContextValue => {
    const context = useContext(ErrorContext);

    if (context === undefined) {
        throw new Error('useErrorContext must be used within an ErrorProvider');
    }

    return context;
};

/**
 * Optional hook that returns undefined if not within ErrorProvider
 * Useful for components that may or may not be within the error context
 */
export const useOptionalErrorContext = (): ErrorContextValue | undefined => {
    return useContext(ErrorContext);
};

export default ErrorContext;
