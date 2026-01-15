import { ComponentType, ErrorInfo as ReactErrorInfo, ReactNode } from 'react';

/**
 * Types of errors that can be caught and handled
 */
export type ErrorType =
    | 'runtime' // JavaScript runtime errors
    | 'chunk_load' // Dynamic import / code-splitting failures
    | 'network' // API / fetch failures
    | 'auth' // Authentication / authorization errors
    | 'validation' // Form / data validation errors
    | 'timeout' // Request timeout errors
    | 'unknown'; // Unclassified errors

/**
 * Severity levels for error reporting and display
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Structured error information for logging and display
 */
export interface ErrorInfo {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    stack?: string;
    componentStack?: string;
    timestamp: Date;
    recoverable: boolean;
    errorId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Props for error fallback components
 */
export interface ErrorFallbackProps {
    error: Error;
    errorInfo: ErrorInfo;
    resetError: () => void;
    isResetting?: boolean;
}

/**
 * Props for the main ErrorBoundary component
 */
export interface ErrorBoundaryProps {
    children: ReactNode;
    /** Custom fallback component to render on error */
    fallback?: ComponentType<ErrorFallbackProps>;
    /** Fallback UI element (alternative to component) */
    fallbackRender?: (props: ErrorFallbackProps) => ReactNode;
    /** Callback when an error is caught */
    onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
    /** Callback when error boundary resets */
    onReset?: () => void;
    /** Key to force reset of error boundary */
    resetKey?: string | number;
    /** Isolate this boundary (don't propagate to parent boundaries) */
    isolate?: boolean;
    /** Custom error classification function */
    classifyError?: (error: Error) => ErrorType;
    /** Show error details in production (default: false) */
    showDetailsInProduction?: boolean;
}

/**
 * State for the ErrorBoundary component
 */
export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    isResetting: boolean;
}

/**
 * Context value for error reporting
 */
export interface ErrorContextValue {
    /** Report an error to the context */
    reportError: (error: Error, metadata?: Record<string, unknown>) => void;
    /** Clear the current error */
    clearError: () => void;
    /** Clear all error history */
    clearAllErrors: () => void;
    /** Get recent errors for debugging */
    recentErrors: ErrorInfo[];
    /** Current error if any */
    currentError: ErrorInfo | null;
    /** Whether error reporting is enabled */
    isEnabled: boolean;
}

/**
 * Options for the useErrorHandler hook
 */
export interface UseErrorHandlerOptions {
    /** Custom error handler callback */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Whether to rethrow the error after handling */
    rethrow?: boolean;
    /** Custom error classification */
    classifyError?: (error: Error) => ErrorType;
    /** Default metadata to include with errors */
    metadata?: Record<string, unknown>;
}

/**
 * Return type for useErrorHandler hook
 */
export interface UseErrorHandlerReturn {
    /** Wrap an async function with error handling */
    handleAsync: <T>(promise: Promise<T>) => Promise<T | undefined>;
    /** Handle a synchronous error */
    handleError: (error: Error) => void;
    /** Current error state */
    error: Error | null;
    /** Clear the current error */
    clearError: () => void;
    /** Whether an error is currently present */
    hasError: boolean;
}

/**
 * Network error with additional context
 */
export interface NetworkError extends Error {
    status?: number;
    statusText?: string;
    url?: string;
    method?: string;
}

/**
 * Chunk load error for dynamic imports
 */
export interface ChunkLoadError extends Error {
    request?: string;
}

/**
 * Helper to check if an error is a ChunkLoadError
 */
export function isChunkLoadError(error: Error): error is ChunkLoadError {
    return (
        error.name === 'ChunkLoadError' ||
        error.message.includes('Loading chunk') ||
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Unable to preload CSS')
    );
}

/**
 * Helper to check if an error is a NetworkError
 */
export function isNetworkError(error: Error): boolean {
    return (
        error.name === 'NetworkError' ||
        (error.name === 'TypeError' && error.message.includes('fetch')) ||
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('net::ERR_')
    );
}

/**
 * Helper to check if an error is an auth error
 */
export function isAuthError(error: Error | NetworkError): boolean {
    if ('status' in error) {
        return error.status === 401 || error.status === 403;
    }
    return (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden') ||
        error.message.includes('Authentication')
    );
}

/**
 * Helper to check if an error is a timeout error
 */
export function isTimeoutError(error: Error): boolean {
    return (
        error.name === 'TimeoutError' ||
        error.message.includes('timeout') ||
        error.message.includes('Timeout')
    );
}

/**
 * Classify an error into an ErrorType
 */
export function classifyError(error: Error): ErrorType {
    if (isChunkLoadError(error)) return 'chunk_load';
    if (isNetworkError(error)) return 'network';
    if (isAuthError(error)) return 'auth';
    if (isTimeoutError(error)) return 'timeout';
    if (error.name === 'ValidationError') return 'validation';
    if (error instanceof TypeError || error instanceof ReferenceError)
        return 'runtime';
    return 'unknown';
}

/**
 * Determine error severity based on type
 */
export function getErrorSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
        case 'auth':
            return 'high';
        case 'chunk_load':
        case 'network':
        case 'timeout':
            return 'medium';
        case 'runtime':
            return 'critical';
        case 'validation':
            return 'low';
        default:
            return 'medium';
    }
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(type: ErrorType, error?: Error): string {
    switch (type) {
        case 'chunk_load':
            return 'A part of the application failed to load. This usually happens due to a network issue or a new update. Please refresh the page.';
        case 'network':
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        case 'auth':
            return "Your session has expired or you don't have permission to perform this action. Please log in again.";
        case 'timeout':
            return 'The request took too long to complete. Please try again.';
        case 'validation':
            return error?.message || 'Please check your input and try again.';
        case 'runtime':
            return 'Something went wrong while processing your request. Our team has been notified.';
        default:
            return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(type: ErrorType): boolean {
    return ['network', 'timeout', 'chunk_load'].includes(type);
}

/**
 * Generate a unique error ID for tracking
 */
export function generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a structured ErrorInfo object from an Error
 */
export function createErrorInfo(
    error: Error,
    componentStack?: string,
    metadata?: Record<string, unknown>,
): ErrorInfo {
    const type = classifyError(error);
    const severity = getErrorSeverity(type);

    return {
        type,
        severity,
        message: error.message,
        userMessage: getUserFriendlyMessage(type, error),
        stack: error.stack,
        componentStack,
        timestamp: new Date(),
        recoverable: isRecoverableError(type),
        errorId: generateErrorId(),
        metadata,
    };
}
