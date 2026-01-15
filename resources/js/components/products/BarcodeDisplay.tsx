import Button from '@/components/ui/button/Button';
import { Copy, Download, Printer, RefreshCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface BarcodeDisplayProps {
    barcode: string | null;
    productName?: string;
    sku?: string;
    price?: number;
    currencySymbol?: string;
    onGenerate?: () => Promise<string | null>;
    isGenerating?: boolean;
    showControls?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Component for displaying and managing product barcodes.
 * Uses JsBarcode for rendering.
 */
export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
    barcode,
    productName,
    sku,
    price,
    currencySymbol = '$',
    onGenerate,
    isGenerating = false,
    showControls = true,
    size = 'md',
    className = '',
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Size configurations
    const sizeConfig = {
        sm: { width: 1.5, height: 40, fontSize: 12 },
        md: { width: 2, height: 60, fontSize: 14 },
        lg: { width: 2.5, height: 80, fontSize: 16 },
    };

    const config = sizeConfig[size];

    // Generate barcode SVG
    useEffect(() => {
        if (!barcode || !svgRef.current) return;

        const renderBarcode = async () => {
            try {
                // Dynamically import JsBarcode
                const JsBarcode = (await import('jsbarcode')).default;

                JsBarcode(svgRef.current, barcode, {
                    format: barcode.length === 13 ? 'EAN13' : 'CODE128',
                    width: config.width,
                    height: config.height,
                    fontSize: config.fontSize,
                    margin: 10,
                    displayValue: true,
                    background: '#ffffff',
                    lineColor: '#000000',
                });

                setError(null);
            } catch (err) {
                console.error('Failed to render barcode:', err);
                setError('Failed to render barcode');
            }
        };

        renderBarcode();
    }, [barcode, config]);

    // Copy barcode to clipboard
    const handleCopy = async () => {
        if (!barcode) return;

        try {
            await navigator.clipboard.writeText(barcode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Download barcode as PNG
    const handleDownload = () => {
        if (!svgRef.current || !barcode) return;

        // Convert SVG to canvas then to PNG
        const svg = svgRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], {
            type: 'image/svg+xml;charset=utf-8',
        });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * 2; // Higher resolution
            canvas.height = img.height * 2;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0);

                // Download
                const link = document.createElement('a');
                link.download = `barcode-${barcode}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }

            URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
    };

    // Print barcode label
    const handlePrint = () => {
        if (!svgRef.current || !barcode) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode - ${barcode}</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .label {
                        text-align: center;
                        padding: 15px;
                        border: 1px dashed #ccc;
                        border-radius: 8px;
                    }
                    .product-name {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .sku {
                        font-size: 11px;
                        color: #666;
                        margin-bottom: 10px;
                    }
                    .price {
                        font-size: 16px;
                        font-weight: bold;
                        margin-top: 10px;
                    }
                    @media print {
                        body { padding: 0; }
                        .label { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    ${productName ? `<div class="product-name">${productName}</div>` : ''}
                    ${sku ? `<div class="sku">SKU: ${sku}</div>` : ''}
                    ${svgData}
                    ${price !== undefined ? `<div class="price">${currencySymbol}${price.toFixed(2)}</div>` : ''}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();
    };

    // No barcode state
    if (!barcode) {
        return (
            <div
                className={`rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800 ${className}`}
            >
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                    No barcode assigned
                </p>
                {onGenerate && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onGenerate}
                        disabled={isGenerating}
                        loading={isGenerating}
                        startIcon={<RefreshCw className="h-4 w-4" />}
                    >
                        Generate Barcode
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${className}`}
        >
            {/* Barcode SVG */}
            <div className="flex justify-center overflow-hidden rounded bg-white p-2">
                {error ? (
                    <p className="text-sm text-error-500">{error}</p>
                ) : (
                    <svg ref={svgRef} />
                )}
            </div>

            {/* Controls */}
            {showControls && (
                <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 gap-1.5 px-2 text-xs"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="h-8 gap-1.5 px-2 text-xs"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handlePrint}
                        className="h-8 gap-1.5 px-2 text-xs"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                    </Button>

                    {onGenerate && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className="h-8 gap-1.5 px-2 text-xs"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`}
                            />
                            {isGenerating ? 'Generating...' : 'Regenerate'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default BarcodeDisplay;
