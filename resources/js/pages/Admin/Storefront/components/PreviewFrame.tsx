import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useBuilderStore } from '@/stores/builder-store';
import {
    Monitor,
    Tablet,
    Smartphone,
    RefreshCw,
    ArrowLeft,
    Loader2,
    AlertTriangle,
} from 'lucide-react';

interface PreviewFrameProps {
    shopSlug: string;
}

const DEVICE_WIDTHS = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
} as const;

const DEVICE_HEIGHTS = {
    desktop: '100%',
    tablet: '1024px',
    mobile: '812px',
} as const;

export function PreviewFrame({ shopSlug }: PreviewFrameProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const previewMode = useBuilderStore((s) => s.previewMode);
    const setPreviewMode = useBuilderStore((s) => s.setPreviewMode);
    const togglePreview = useBuilderStore((s) => s.togglePreview);
    const lastSaveAt = useBuilderStore((s) => s.lastSaveAt);

    const previewUrl = `/store/${shopSlug}`;
    const lastSaveRef = useRef(lastSaveAt);

    useEffect(() => {
        if (lastSaveRef.current !== lastSaveAt && lastSaveRef.current !== 0) {
            handleReload();
        }
        lastSaveRef.current = lastSaveAt;
    }, [lastSaveAt]);

    function handleReload() {
        if (!iframeRef.current) return;
        setIsLoading(true);
        setHasError(false);
        try {
            iframeRef.current.contentWindow?.location.reload();
        } catch {
            iframeRef.current.src = previewUrl;
        }
    }

    function handleIframeLoad() {
        setIsLoading(false);
    }

    function handleIframeError() {
        setIsLoading(false);
        setHasError(true);
    }

    const isContained = previewMode !== 'desktop';

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                <Button
                    size="sm"
                    variant="ghost"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={togglePreview}
                >
                    Back to Editor
                </Button>

                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                    {([
                        { mode: 'desktop' as const, icon: Monitor, label: 'Desktop' },
                        { mode: 'tablet' as const, icon: Tablet, label: 'Tablet' },
                        { mode: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
                    ]).map(({ mode, icon: Icon, label }) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setPreviewMode(mode)}
                            className={`rounded-md px-2.5 py-1.5 transition-all ${
                                previewMode === mode
                                    ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                            aria-label={label}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    ))}
                </div>

                <Button
                    size="sm"
                    variant="ghost"
                    startIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
                    onClick={handleReload}
                    disabled={isLoading}
                >
                    Reload
                </Button>
            </div>

            <div
                className={`relative flex-1 overflow-auto ${
                    isContained
                        ? 'bg-[radial-gradient(circle,_rgba(107,114,128,0.15)_1px,_transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(circle,_rgba(55,65,81,0.4)_1px,_transparent_1px)]'
                        : 'bg-gray-100 dark:bg-gray-900'
                }`}
            >
                <div
                    className={`mx-auto h-full transition-all duration-300 ease-out ${
                        isContained ? 'py-6' : ''
                    }`}
                    style={{
                        width: DEVICE_WIDTHS[previewMode],
                        maxWidth: '100%',
                    }}
                >
                    <div
                        className={`relative h-full ${
                            isContained
                                ? 'overflow-hidden rounded-xl border border-gray-300 shadow-2xl dark:border-gray-600'
                                : ''
                        }`}
                        style={isContained ? { height: DEVICE_HEIGHTS[previewMode], maxHeight: 'calc(100vh - 140px)' } : undefined}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-gray-900">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Loading preview...
                                    </span>
                                </div>
                            </div>
                        )}

                        {hasError ? (
                            <div className="flex h-full items-center justify-center bg-white p-8 dark:bg-gray-900">
                                <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-500/10">
                                        <AlertTriangle className="h-6 w-6 text-warning-500" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Preview unavailable
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        The storefront couldn't be loaded. Make sure it's enabled in your shop settings.
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleReload}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <iframe
                                ref={iframeRef}
                                src={previewUrl}
                                title="Storefront Preview"
                                className="h-full w-full border-0 bg-white"
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
