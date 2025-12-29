import { useState, useCallback, useRef } from 'react';
import {
    UseErrorHandlerOptions,
    UseErrorHandlerReturn,
    ErrorInfo,
    createErrorInfo,
    classifyError as defaultClassifyError,
} from '@/types/error';
import { useOptionalErrorContext } from '@/context/ErrorContext';

/**
 * useErrorHandler - A hook for handling async errors and manual error reporting
 *
 * Use this hook when you need to:
 * - Catch errors from async operations (API calls, etc.)
 * - Handle errors in event handlers
 * - Report errors programmatically
 *
 * @example
 * ```tsx
 * const { handleAsync, error, clearError } = useErrorHandler();
 *
 * const handleSubmit = async () => {
 *   const result = await handleAsync(api.submitForm(data));
 *   if (result) {
 *     // Success
 *   }
 * };
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
    const {
        onError,
        rethrow = false,
        classifyError = defaultClassifyError,
        metadata,
    } = options;

    const [error, setError] = useState<Error | null>(null);
    const errorContext = useOptionalErrorContext();
    const metadataRef = useRef(metadata);

    // Update metadata ref when it changes
    metadataRef.current = metadata;

    /**
     * Handle an error by creating error info, calling callbacks, and updating state
     */
    const handleError = useCallback(
        (err: Error): void => {
            const errorInfo = createErrorInfo(err, undefined, metadataRef.current);

            // Override classification if custom classifier provided
            if (classifyError !== defaultClassifyError) {
                errorInfo.type = classifyError(err);
            }

            // Update local state
            setError(err);

            // Report to error context if available
            if (errorContext?.isEnabled) {
                errorContext.reportError(err, metadataRef.current);
            }

            // Call error callback if provided
            if (onError) {
                onError(err, errorInfo);
            }

            // Log in development
            if (import.meta.env.DEV) {
                console.error('[useErrorHandler] Caught error:', err);
            }

            // Rethrow if configured
            if (rethrow) {
                throw err;
            }
        },
        [onError, rethrow, classifyError, errorContext]
    );

    /**
     * Wrap an async operation with error handling
     */
    const handleAsync = useCallback(
        async <T>(promise: Promise<T>): Promise<T | undefined> => {
            try {
                return await promise;
            } catch (err) {
                handleError(err instanceof Error ? err : new Error(String(err)));
                return undefined;
            }
        },
        [handleError]
    );

    /**
     * Clear the current error
     */
    const clearError = useCallback(() => {
        setError(null);
        if (errorContext?.isEnabled) {
            errorContext.clearError();
        }
    }, [errorContext]);

    return {
        handleAsync,
        handleError,
        error,
        clearError,
        hasError: error !== null,
    };
}

/**
 * useAsyncError - Simpler hook for just catching async errors
 *
 * @example
 * ```tsx
 * const { execute, error, isLoading } = useAsyncError();
 *
 * const handleClick = () => {
 *   execute(async () => {
 *     await api.doSomething();
 *   });
 * };
 * ```
 */
export function useAsyncError<T = void>() {
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | undefined> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await asyncFn();
            setData(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            return undefined;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setError(null);
        setData(null);
        setIsLoading(false);
    }, []);

    return {
        execute,
        error,
        isLoading,
        data,
        hasError: error !== null,
        reset,
    };
}

/**
 * useSafeAsync - Hook for safe async operations with automatic error boundaries
 *
 * @example
 * ```tsx
 * const fetchData = useSafeAsync(
 *   () => api.getData(),
 *   { onError: (err) => toast.error(err.message) }
 * );
 *
 * useEffect(() => {
 *   fetchData();
 * }, []);
 * ```
 */
export function useSafeAsync<T, Args extends unknown[] = []>(
    asyncFn: (...args: Args) => Promise<T>,
    options: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        onSettled?: () => void;
    } = {}
) {
    const { onSuccess, onError, onSettled } = options;
    const [state, setState] = useState<{
        data: T | null;
        error: Error | null;
        isLoading: boolean;
    }>({
        data: null,
        error: null,
        isLoading: false,
    });

    const execute = useCallback(
        async (...args: Args): Promise<T | undefined> => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const data = await asyncFn(...args);
                setState({ data, error: null, isLoading: false });
                onSuccess?.(data);
                return data;
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setState((prev) => ({ ...prev, error, isLoading: false }));
                onError?.(error);
                return undefined;
            } finally {
                onSettled?.();
            }
        },
        [asyncFn, onSuccess, onError, onSettled]
    );

    const reset = useCallback(() => {
        setState({ data: null, error: null, isLoading: false });
    }, []);

    return {
        ...state,
        execute,
        reset,
        hasError: state.error !== null,
    };
}

export default useErrorHandler;
