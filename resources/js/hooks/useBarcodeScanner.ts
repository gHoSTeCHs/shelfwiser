import { useCallback, useEffect, useRef, useState } from 'react';

interface UseBarcodeSccannerOptions {
    onScan: (barcode: string) => void;
    onError?: (error: string) => void;
    scanDelay?: number; // Minimum time between scans (ms)
    minLength?: number; // Minimum barcode length
    maxLength?: number; // Maximum barcode length
    enabled?: boolean;
}

interface UseBarcodeSccannerReturn {
    // Input mode (for external scanners)
    inputRef: React.RefObject<HTMLInputElement>;
    inputValue: string;
    setInputValue: (value: string) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    focusInput: () => void;

    // Camera mode
    isCameraActive: boolean;
    isCameraSupported: boolean;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    cameraError: string | null;
    videoRef: React.RefObject<HTMLDivElement>;

    // Scanner detection
    isExternalScanner: boolean;
    lastScanTime: number | null;
}

/**
 * Hook for handling barcode scanning from both external scanners and camera.
 *
 * External scanners work by emulating rapid keyboard input followed by Enter.
 * We detect this by tracking keystroke timing - if characters arrive faster
 * than ~50ms average, it's likely a scanner.
 */
export function useBarcodeScanner(options: UseBarcodeSccannerOptions): UseBarcodeSccannerReturn {
    const {
        onScan,
        onError,
        scanDelay = 500,
        minLength = 4,
        maxLength = 50,
        enabled = true,
    } = options;

    const [inputValue, setInputValue] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isExternalScanner, setIsExternalScanner] = useState(false);
    const [lastScanTime, setLastScanTime] = useState<number | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<any>(null);

    // Track keystroke timing for scanner detection
    const keystrokeTimesRef = useRef<number[]>([]);
    const lastKeystrokeRef = useRef<number>(0);
    const scannerBufferRef = useRef<string>('');
    const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if camera is supported
    const isCameraSupported = typeof navigator !== 'undefined' &&
        'mediaDevices' in navigator &&
        'getUserMedia' in navigator.mediaDevices;

    // Process a successful scan
    const processScan = useCallback((barcode: string) => {
        const trimmed = barcode.trim();

        if (trimmed.length < minLength || trimmed.length > maxLength) {
            return;
        }

        // Check scan delay
        const now = Date.now();
        if (lastScanTime && now - lastScanTime < scanDelay) {
            return;
        }

        setLastScanTime(now);
        onScan(trimmed);
        setInputValue('');
        scannerBufferRef.current = '';
    }, [onScan, scanDelay, minLength, maxLength, lastScanTime]);

    // Handle input change (manual typing or scanner)
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
    }, []);

    // Handle keydown for detecting scanner input
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!enabled) return;

        const now = Date.now();
        const timeSinceLastKey = now - lastKeystrokeRef.current;
        lastKeystrokeRef.current = now;

        // Track keystroke timing
        if (timeSinceLastKey < 100) {
            keystrokeTimesRef.current.push(timeSinceLastKey);
            // Keep only last 10 keystrokes for average
            if (keystrokeTimesRef.current.length > 10) {
                keystrokeTimesRef.current.shift();
            }
        }

        // Calculate average keystroke time
        const avgKeystrokeTime = keystrokeTimesRef.current.length > 0
            ? keystrokeTimesRef.current.reduce((a, b) => a + b, 0) / keystrokeTimesRef.current.length
            : 100;

        // If average is under 50ms, likely a scanner
        const likelyScanner = avgKeystrokeTime < 50 && keystrokeTimesRef.current.length >= 3;
        setIsExternalScanner(likelyScanner);

        // Handle Enter key
        if (e.key === 'Enter') {
            e.preventDefault();

            const value = inputValue.trim();
            if (value.length >= minLength) {
                processScan(value);
            }

            // Reset scanner detection
            keystrokeTimesRef.current = [];
            return;
        }

        // Clear buffer after timeout (for manual typing)
        if (scannerTimeoutRef.current) {
            clearTimeout(scannerTimeoutRef.current);
        }

        scannerTimeoutRef.current = setTimeout(() => {
            keystrokeTimesRef.current = [];
            setIsExternalScanner(false);
        }, 200);
    }, [enabled, inputValue, minLength, processScan]);

    // Focus input
    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    // Start camera scanning
    const startCamera = useCallback(async () => {
        if (!isCameraSupported) {
            setCameraError('Camera not supported on this device');
            return;
        }

        try {
            // Dynamically import html5-qrcode
            const { Html5Qrcode } = await import('html5-qrcode');

            if (!videoRef.current) {
                setCameraError('Video container not available');
                return;
            }

            const scannerId = 'barcode-scanner-video';

            // Ensure container has an ID
            videoRef.current.id = scannerId;

            // Create scanner instance
            const html5QrCode = new Html5Qrcode(scannerId);
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 100 },
                aspectRatio: 1.777778,
            };

            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                (decodedText: string) => {
                    processScan(decodedText);
                    // Optional: vibrate on successful scan
                    if ('vibrate' in navigator) {
                        navigator.vibrate(100);
                    }
                },
                () => {
                    // QR code scan error - ignore (happens frequently when no code in view)
                }
            );

            setIsCameraActive(true);
            setCameraError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start camera';
            setCameraError(message);
            onError?.(message);
        }
    }, [isCameraSupported, processScan, onError]);

    // Stop camera scanning
    const stopCamera = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
            } catch (error) {
                console.error('Error stopping camera:', error);
            }
        }
        setIsCameraActive(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => {});
            }
            if (scannerTimeoutRef.current) {
                clearTimeout(scannerTimeoutRef.current);
            }
        };
    }, []);

    // Global keyboard listener for scanner input when input is not focused
    useEffect(() => {
        if (!enabled) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // Only capture printable characters and Enter
            if (e.key.length === 1 || e.key === 'Enter') {
                // Add to scanner buffer
                if (e.key === 'Enter') {
                    if (scannerBufferRef.current.length >= minLength) {
                        processScan(scannerBufferRef.current);
                    }
                    scannerBufferRef.current = '';
                } else {
                    scannerBufferRef.current += e.key;

                    // Clear buffer after timeout
                    if (scannerTimeoutRef.current) {
                        clearTimeout(scannerTimeoutRef.current);
                    }
                    scannerTimeoutRef.current = setTimeout(() => {
                        scannerBufferRef.current = '';
                    }, 200);
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [enabled, minLength, processScan]);

    return {
        inputRef: inputRef as React.RefObject<HTMLInputElement>,
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
        videoRef: videoRef as React.RefObject<HTMLDivElement>,
        isExternalScanner,
        lastScanTime,
    };
}

export default useBarcodeScanner;
