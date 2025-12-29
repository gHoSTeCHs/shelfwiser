import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorFallbackProps } from '@/types/error';
import Button from '@/components/ui/button/Button';

interface ErrorFallbackMinimalProps extends ErrorFallbackProps {
    /** Compact mode with smaller padding */
    compact?: boolean;
    /** Custom class name */
    className?: string;
    /** Custom retry button text */
    retryText?: string;
    /** Hide the retry button */
    hideRetry?: boolean;
}

/**
 * ErrorFallbackMinimal - A lightweight inline error display component
 *
 * Use this for:
 * - Cards and widgets that can fail independently
 * - Modal content errors
 * - List item loading failures
 * - Any UI section where a full-page error would be disruptive
 *
 * Features:
 * - Compact design that fits within existing layouts
 * - Matches Alert component styling
 * - Optional retry functionality
 * - Dark mode support
 */
const ErrorFallbackMinimal: React.FC<ErrorFallbackMinimalProps> = ({
    error,
    errorInfo,
    resetError,
    isResetting = false,
    compact = false,
    className = '',
    retryText = 'Retry',
    hideRetry = false,
}) => {
    const padding = compact ? 'p-3' : 'p-4';

    return (
        <div
            className={`
                rounded-xl border border-error-500 bg-error-50
                dark:border-error-500/30 dark:bg-error-500/15
                ${padding} ${className}
            `}
            role="alert"
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 -mt-0.5 text-error-500">
                    <AlertTriangle className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-gray-800 dark:text-white/90 ${compact ? 'text-xs' : 'text-sm'}`}>
                        Something went wrong
                    </h4>

                    <p className={`text-gray-600 dark:text-gray-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                        {errorInfo.userMessage}
                    </p>

                    {/* Retry Button */}
                    {!hideRetry && errorInfo.recoverable && (
                        <div className="mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetError}
                                disabled={isResetting}
                                loading={isResetting}
                                startIcon={!isResetting ? <RefreshCw className="h-3 w-3" /> : undefined}
                            >
                                {isResetting ? 'Retrying...' : retryText}
                            </Button>
                        </div>
                    )}

                    {/* Error ID for support */}
                    {errorInfo.errorId && !compact && (
                        <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                            ID: {errorInfo.errorId}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Simpler variant for very constrained spaces
 */
export const ErrorFallbackTiny: React.FC<{
    resetError?: () => void;
    message?: string;
    className?: string;
}> = ({
    resetError,
    message = 'Failed to load',
    className = '',
}) => {
    return (
        <div
            className={`
                flex items-center justify-center gap-2 py-4 px-3
                text-sm text-error-600 dark:text-error-400
                ${className}
            `}
            role="alert"
        >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{message}</span>
            {resetError && (
                <button
                    onClick={resetError}
                    className="ml-2 text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 underline text-sm"
                >
                    Retry
                </button>
            )}
        </div>
    );
};

export default ErrorFallbackMinimal;
