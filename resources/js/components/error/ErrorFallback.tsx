import Button from '@/components/ui/button/Button';
import { ErrorFallbackProps, ErrorInfo } from '@/types/error';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Home,
    RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';

interface ExtendedErrorFallbackProps extends ErrorFallbackProps {
    /** Show technical error details */
    showDetails?: boolean;
    /** Custom title override */
    title?: string;
    /** Custom description override */
    description?: string;
    /** Hide the home button */
    hideHomeButton?: boolean;
    /** Hide the back button */
    hideBackButton?: boolean;
    /** Custom home URL */
    homeUrl?: string;
}

/**
 * ErrorFallback - A full-page error display component
 *
 * Features:
 * - Responsive design for all screen sizes
 * - Dark mode support
 * - Error details collapsible section (dev only by default)
 * - Copy error details to clipboard
 * - Recovery actions: Retry, Go Home, Go Back
 * - Matches the ShelfWise design system
 */
const ErrorFallback: React.FC<ExtendedErrorFallbackProps> = ({
    error,
    errorInfo,
    resetError,
    isResetting = false,
    showDetails = false,
    title,
    description,
    hideHomeButton = false,
    hideBackButton = false,
    homeUrl = '/',
}) => {
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [copied, setCopied] = useState(false);

    const errorTitle = title || getErrorTitle(errorInfo);
    const errorDescription = description || errorInfo.userMessage;

    const handleCopyError = async () => {
        const errorText = formatErrorForCopy(error, errorInfo);
        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy error:', err);
        }
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = homeUrl;
        }
    };

    const handleGoHome = () => {
        window.location.href = homeUrl;
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8 dark:bg-gray-900">
            <div className="w-full max-w-lg">
                {/* Error Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-md sm:p-8 dark:border-gray-800 dark:bg-white/[0.03]">
                    {/* Error Icon */}
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error-50 sm:h-20 sm:w-20 dark:bg-error-500/15">
                        <AlertTriangle className="h-8 w-8 text-error-500 sm:h-10 sm:w-10" />
                    </div>

                    {/* Error Title */}
                    <h1 className="mb-3 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
                        {errorTitle}
                    </h1>

                    {/* Error Description */}
                    <p className="mb-6 text-sm leading-relaxed text-gray-500 sm:text-base dark:text-gray-400">
                        {errorDescription}
                    </p>

                    {/* Error ID */}
                    {errorInfo.errorId && (
                        <p className="font-mono mb-6 text-xs text-gray-400 dark:text-gray-500">
                            Error ID: {errorInfo.errorId}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="mb-6 flex flex-col justify-center gap-3 sm:flex-row">
                        {errorInfo.recoverable && (
                            <Button
                                variant="primary"
                                onClick={resetError}
                                disabled={isResetting}
                                loading={isResetting}
                                startIcon={
                                    !isResetting ? (
                                        <RefreshCw className="h-4 w-4" />
                                    ) : undefined
                                }
                            >
                                {isResetting ? 'Retrying...' : 'Try Again'}
                            </Button>
                        )}

                        {!hideHomeButton && (
                            <Button
                                variant="outline"
                                onClick={handleGoHome}
                                startIcon={<Home className="h-4 w-4" />}
                            >
                                Go Home
                            </Button>
                        )}

                        {!hideBackButton && (
                            <Button
                                variant="ghost"
                                onClick={handleGoBack}
                                startIcon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Go Back
                            </Button>
                        )}
                    </div>

                    {/* Error Details (Collapsible) */}
                    {showDetails && (
                        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                            <button
                                onClick={() =>
                                    setShowErrorDetails(!showErrorDetails)
                                }
                                className="flex w-full items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <span>Technical Details</span>
                                {showErrorDetails ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </button>

                            {showErrorDetails && (
                                <div className="mt-4 text-left">
                                    {/* Copy Button */}
                                    <div className="mb-2 flex justify-end">
                                        <button
                                            onClick={handleCopyError}
                                            className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-3 w-3 text-success-500" />
                                                    <span className="text-success-500">
                                                        Copied!
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Error Details Box */}
                                    <div className="max-h-60 overflow-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                                        <div className="font-mono space-y-3 text-xs">
                                            {/* Error Type */}
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Type:{' '}
                                                </span>
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {errorInfo.type}
                                                </span>
                                            </div>

                                            {/* Error Name */}
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Name:{' '}
                                                </span>
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {error.name}
                                                </span>
                                            </div>

                                            {/* Error Message */}
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Message:{' '}
                                                </span>
                                                <span className="break-words text-error-600 dark:text-error-400">
                                                    {error.message}
                                                </span>
                                            </div>

                                            {/* Stack Trace */}
                                            {error.stack && (
                                                <div>
                                                    <span className="mb-1 block text-gray-500 dark:text-gray-400">
                                                        Stack Trace:
                                                    </span>
                                                    <pre className="text-[10px] leading-relaxed break-words whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                                        {error.stack}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Component Stack */}
                                            {errorInfo.componentStack && (
                                                <div>
                                                    <span className="mb-1 block text-gray-500 dark:text-gray-400">
                                                        Component Stack:
                                                    </span>
                                                    <pre className="text-[10px] leading-relaxed break-words whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                                        {
                                                            errorInfo.componentStack
                                                        }
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Support Link */}
                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    If this problem persists, please{' '}
                    <a
                        href="mailto:support@shelfwise.com"
                        className="text-brand-500 underline hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                        contact support
                    </a>
                </p>
            </div>
        </div>
    );
};

/**
 * Get error title based on error type
 */
function getErrorTitle(errorInfo: ErrorInfo): string {
    switch (errorInfo.type) {
        case 'chunk_load':
            return 'Failed to Load';
        case 'network':
            return 'Connection Error';
        case 'auth':
            return 'Access Denied';
        case 'timeout':
            return 'Request Timeout';
        case 'validation':
            return 'Invalid Data';
        case 'runtime':
            return 'Something Went Wrong';
        default:
            return 'Unexpected Error';
    }
}

/**
 * Format error details for clipboard
 */
function formatErrorForCopy(error: Error, errorInfo: ErrorInfo): string {
    const lines = [
        `Error Report`,
        `============`,
        ``,
        `Error ID: ${errorInfo.errorId || 'N/A'}`,
        `Type: ${errorInfo.type}`,
        `Severity: ${errorInfo.severity}`,
        `Timestamp: ${errorInfo.timestamp.toISOString()}`,
        `Recoverable: ${errorInfo.recoverable}`,
        ``,
        `Error Name: ${error.name}`,
        `Error Message: ${error.message}`,
        ``,
        `Stack Trace:`,
        error.stack || 'N/A',
    ];

    if (errorInfo.componentStack) {
        lines.push('', 'Component Stack:', errorInfo.componentStack);
    }

    return lines.join('\n');
}

export default ErrorFallback;
