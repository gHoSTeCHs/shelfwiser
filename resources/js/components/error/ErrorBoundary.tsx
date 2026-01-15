import {
    ErrorBoundaryProps,
    ErrorBoundaryState,
    createErrorInfo,
    isChunkLoadError,
} from '@/types/error';
import React, { Component, ErrorInfo as ReactErrorInfo } from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * ErrorBoundary - A React Error Boundary component that catches JavaScript errors
 * in its child component tree and displays a fallback UI.
 *
 * Features:
 * - Catches and classifies different error types
 * - Provides recovery mechanisms
 * - Integrates with error reporting
 * - Supports custom fallback components
 * - Handles code-splitting errors specially
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isResetting: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Update state so the next render shows the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, reactErrorInfo: ReactErrorInfo): void {
        const { onError, classifyError } = this.props;

        // Create structured error info
        const errorInfo = createErrorInfo(
            error,
            reactErrorInfo.componentStack || undefined,
        );

        // Override classification if custom classifier provided
        if (classifyError) {
            errorInfo.type = classifyError(error);
        }

        // Update state with full error info
        this.setState({ errorInfo });

        // Call error callback if provided
        if (onError) {
            onError(error, reactErrorInfo);
        }

        // Log error in development
        if (import.meta.env.DEV) {
            console.group('[ErrorBoundary] Caught error');
            console.error('Error:', error);
            console.info('Error Info:', errorInfo);
            console.info('Component Stack:', reactErrorInfo.componentStack);
            console.groupEnd();
        }
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps): void {
        const { resetKey } = this.props;
        const { hasError } = this.state;

        // Reset error state if resetKey changes
        if (hasError && prevProps.resetKey !== resetKey) {
            this.resetError();
        }
    }

    resetError = (): void => {
        const { onReset } = this.props;
        const { error, errorInfo } = this.state;

        this.setState({ isResetting: true });

        // For chunk load errors, do a hard refresh
        if (error && isChunkLoadError(error)) {
            window.location.reload();
            return;
        }

        // Short delay to show loading state
        setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                isResetting: false,
            });

            if (onReset) {
                onReset();
            }
        }, 300);
    };

    render(): React.ReactNode {
        const {
            children,
            fallback: FallbackComponent,
            fallbackRender,
            showDetailsInProduction,
        } = this.props;
        const { hasError, error, errorInfo, isResetting } = this.state;

        if (hasError && error) {
            // Create fallback props
            const fallbackProps = {
                error,
                errorInfo: errorInfo || createErrorInfo(error),
                resetError: this.resetError,
                isResetting,
            };

            // Use custom fallback render function if provided
            if (fallbackRender) {
                return fallbackRender(fallbackProps);
            }

            // Use custom fallback component if provided
            if (FallbackComponent) {
                return <FallbackComponent {...fallbackProps} />;
            }

            // Use default ErrorFallback
            return (
                <ErrorFallback
                    {...fallbackProps}
                    showDetails={showDetailsInProduction || import.meta.env.DEV}
                />
            );
        }

        return children;
    }
}

export default ErrorBoundary;

/**
 * Higher-order component to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
): React.FC<P> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const ComponentWithErrorBoundary: React.FC<P> = (props) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

    return ComponentWithErrorBoundary;
}
