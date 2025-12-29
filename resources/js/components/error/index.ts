/**
 * Error Boundary System
 *
 * A comprehensive error handling system for React applications.
 *
 * Components:
 * - ErrorBoundary: Core error boundary wrapper
 * - ErrorFallback: Full-page error display
 * - ErrorFallbackMinimal: Inline error display
 * - ChunkLoadErrorFallback: Code-splitting error handler
 * - NetworkErrorFallback: API/network error handler
 *
 * @example Basic Usage
 * ```tsx
 * import { ErrorBoundary } from '@/components/error';
 *
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <MyComponent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 *
 * @example With Custom Fallback
 * ```tsx
 * import { ErrorBoundary, ErrorFallbackMinimal } from '@/components/error';
 *
 * function MyWidget() {
 *   return (
 *     <ErrorBoundary fallback={ErrorFallbackMinimal}>
 *       <WidgetContent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 *
 * @example With HOC
 * ```tsx
 * import { withErrorBoundary } from '@/components/error';
 *
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   onError: (error) => console.error(error),
 * });
 * ```
 */

// Core components
export { default as ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { default as ErrorFallback } from './ErrorFallback';
export { default as ErrorFallbackMinimal, ErrorFallbackTiny } from './ErrorFallbackMinimal';
export { default as ChunkLoadErrorFallback } from './ChunkLoadErrorFallback';
export { default as NetworkErrorFallback } from './NetworkErrorFallback';

// Re-export types for convenience
export type {
    ErrorType,
    ErrorSeverity,
    ErrorInfo,
    ErrorFallbackProps,
    ErrorBoundaryProps,
    ErrorBoundaryState,
    NetworkError,
    ChunkLoadError,
} from '@/types/error';

// Re-export utility functions
export {
    isChunkLoadError,
    isNetworkError,
    isAuthError,
    isTimeoutError,
    classifyError,
    getErrorSeverity,
    getUserFriendlyMessage,
    isRecoverableError,
    generateErrorId,
    createErrorInfo,
} from '@/types/error';
