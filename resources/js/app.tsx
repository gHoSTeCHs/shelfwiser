import '../css/app.css';

import { ChunkLoadErrorFallback, ErrorBoundary } from '@/components/error';
import { ErrorProvider } from '@/context/ErrorContext';
import { ThemeProvider } from '@/context/ThemeContext.tsx';
import { ToastProvider } from '@/contexts/ToastContext';
import { isChunkLoadError } from '@/types/error';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Global error handler for unhandled errors
 */
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to console in development
    if (import.meta.env.DEV) {
        console.error('[App] Unhandled error:', error);
        console.error('[App] Component stack:', errorInfo.componentStack);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (import.meta.env.PROD) {
    //     Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // }
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary
                onError={handleGlobalError}
                fallbackRender={({
                    error,
                    errorInfo,
                    resetError,
                    isResetting,
                }) => {
                    // Use specialized fallback for chunk load errors
                    if (isChunkLoadError(error)) {
                        return (
                            <ChunkLoadErrorFallback
                                error={error}
                                resetError={resetError}
                                isResetting={isResetting}
                            />
                        );
                    }
                    // Default fallback will be rendered by ErrorBoundary
                    return null;
                }}
            >
                <ErrorProvider
                    onError={(errorInfo) => {
                        // Log reported errors
                        if (import.meta.env.DEV) {
                            console.info(
                                '[ErrorProvider] Error reported:',
                                errorInfo,
                            );
                        }
                    }}
                >
                    <ThemeProvider>
                        <ToastProvider>
                            <App {...props} />
                        </ToastProvider>
                    </ThemeProvider>
                </ErrorProvider>
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#4B5563',
    },
}).then((r) => {});

// This will set light / dark mode on load...
initializeTheme();
