import Button from '@/components/ui/button/Button';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Camera, CameraOff, Scan, X, Zap } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onError?: (error: string) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    showCameraButton?: boolean;
    className?: string;
}

/**
 * Barcode Scanner Component
 *
 * Supports two scanning modes:
 * 1. External Scanner (USB/Bluetooth) - Captures rapid keyboard input
 * 2. Camera Scanner - Uses device camera to scan barcodes
 *
 * External scanners work automatically when focused on the input field.
 * The camera can be toggled with the camera button.
 */
export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScan,
    onError,
    placeholder = 'Scan barcode or search...',
    disabled = false,
    autoFocus = true,
    showCameraButton = true,
    className = '',
}) => {
    const [showCamera, setShowCamera] = useState(false);

    const {
        inputRef,
        inputValue,
        setInputValue,
        handleInputChange,
        handleKeyDown,
        focusInput,
        isCameraActive,
        isCameraSupported,
        startCamera,
        stopCamera,
        cameraError,
        videoRef,
        isExternalScanner,
    } = useBarcodeScanner({
        onScan: (barcode) => {
            onScan(barcode);
            setShowCamera(false);
            stopCamera();
        },
        onError,
        enabled: !disabled,
    });

    const toggleCamera = useCallback(async () => {
        if (isCameraActive) {
            await stopCamera();
            setShowCamera(false);
        } else {
            setShowCamera(true);
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                startCamera();
            }, 100);
        }
    }, [isCameraActive, startCamera, stopCamera]);

    const closeCamera = useCallback(() => {
        stopCamera();
        setShowCamera(false);
        focusInput();
    }, [stopCamera, focusInput]);

    // Handle manual input submission
    const handleManualSubmit = useCallback(() => {
        if (inputValue.trim().length >= 1) {
            onScan(inputValue.trim());
            setInputValue('');
        }
    }, [inputValue, onScan, setInputValue]);

    return (
        <div className={`relative ${className}`}>
            {/* Input Field */}
            <div className="relative">
                <Scan className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />

                {/* Scanner indicator */}
                {isExternalScanner && (
                    <div className="absolute top-1/2 left-10 -translate-y-1/2">
                        <Zap className="h-4 w-4 animate-pulse text-yellow-500" />
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    aria-label="Barcode or product search"
                    aria-describedby={
                        isExternalScanner ? 'scanner-status' : undefined
                    }
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 pr-24 text-sm shadow-theme-xs transition-colors focus:ring-3 focus:outline-none ${isExternalScanner ? 'pl-14' : 'pl-10'} border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-800`}
                />

                <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                    {/* Search/Submit button */}
                    {inputValue.trim().length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleManualSubmit}
                            aria-label="Search product"
                            className="h-8 w-8 p-0"
                        >
                            <Scan className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    )}

                    {/* Camera toggle button */}
                    {showCameraButton && isCameraSupported && (
                        <Button
                            type="button"
                            variant={isCameraActive ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={toggleCamera}
                            disabled={disabled}
                            aria-label={
                                isCameraActive
                                    ? 'Stop camera scanner'
                                    : 'Start camera scanner'
                            }
                            aria-pressed={isCameraActive}
                            className={`h-8 w-8 p-0 ${isCameraActive ? 'bg-brand-600 text-white' : ''}`}
                        >
                            {isCameraActive ? (
                                <CameraOff
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Camera
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Camera Preview */}
            {showCamera && (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-gray-700">
                    <div className="relative">
                        {/* Close button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={closeCamera}
                            aria-label="Close camera scanner"
                            className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/50 p-0 hover:bg-black/70"
                        >
                            <X
                                className="h-4 w-4 text-white"
                                aria-hidden="true"
                            />
                        </Button>

                        {/* Video container */}
                        <div
                            ref={videoRef}
                            className="aspect-video w-full"
                            style={{ minHeight: '200px' }}
                        />

                        {/* Scanning indicator overlay */}
                        {isCameraActive && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="h-24 w-64 rounded border-2 border-brand-500 bg-brand-500/10">
                                    <div className="h-full w-full animate-pulse border border-brand-400/50" />
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                                <div className="p-4 text-center">
                                    <CameraOff className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                                    <p className="text-sm text-gray-300">
                                        {cameraError}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={startCamera}
                                        className="mt-3"
                                    >
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-800 px-3 py-2 text-center text-xs text-gray-300">
                        Position barcode within the frame
                    </div>
                </div>
            )}

            {/* Scanner mode indicator */}
            {isExternalScanner && !showCamera && (
                <div
                    id="scanner-status"
                    className="mt-1 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"
                    role="status"
                    aria-live="polite"
                >
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    <span>External scanner detected</span>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
