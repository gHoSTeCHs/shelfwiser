import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ErrorFallbackProps, ErrorInfo } from '@/types/error';
import Button from '@/components/ui/button/Button';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-lg">
                {/* Error Card */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 sm:p-8 text-center shadow-theme-md">
                    {/* Error Icon */}
                    <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
                        <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-error-500" />
                    </div>

                    {/* Error Title */}
                    <h1 className="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                        {errorTitle}
                    </h1>

                    {/* Error Description */}
                    <p className="mb-6 text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                        {errorDescription}
                    </p>

                    {/* Error ID */}
                    {errorInfo.errorId && (
                        <p className="mb-6 text-xs text-gray-400 dark:text-gray-500 font-mono">
                            Error ID: {errorInfo.errorId}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                        {errorInfo.recoverable && (
                            <Button
                                variant="primary"
                                onClick={resetError}
                                disabled={isResetting}
                                loading={isResetting}
                                startIcon={!isResetting ? <RefreshCw className="h-4 w-4" /> : undefined}
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
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                            <button
                                onClick={() => setShowErrorDetails(!showErrorDetails)}
                                className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
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
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={handleCopyError}
                                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-3 w-3 text-success-500" />
                                                    <span className="text-success-500">Copied!</span>
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
                                    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4 overflow-auto max-h-60">
                                        <div className="space-y-3 text-xs font-mono">
                                            {/* Error Type */}
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Type: </span>
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {errorInfo.type}
                                                </span>
                                            </div>

                                            {/* Error Name */}
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Name: </span>
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {error.name}
                                                </span>
                                            </div>

                                            {/* Error Message */}
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Message: </span>
                                                <span className="text-error-600 dark:text-error-400 break-words">
                                                    {error.message}
                                                </span>
                                            </div>

                                            {/* Stack Trace */}
                                            {error.stack && (
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400 block mb-1">
                                                        Stack Trace:
                                                    </span>
                                                    <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-[10px] leading-relaxed">
                                                        {error.stack}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Component Stack */}
                                            {errorInfo.componentStack && (
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400 block mb-1">
                                                        Component Stack:
                                                    </span>
                                                    <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-[10px] leading-relaxed">
                                                        {errorInfo.componentStack}
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
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 underline"
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
