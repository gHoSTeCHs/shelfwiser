import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Image } from '@/types/image';

interface ImageUploaderProps {
    modelType: 'Product' | 'ProductVariant' | 'Service';
    modelId: number;
    onUploadSuccess?: (images: Image[]) => void;
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
}

/**
 * ImageUploader Component
 * Handles drag-and-drop or click-to-upload image functionality
 */
export default function ImageUploader({
    modelType,
    modelId,
    onUploadSuccess,
    maxFiles = 10,
    disabled = false,
    className = '',
}: ImageUploaderProps) {
    const [uploading, setUploading] = React.useState(false);
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            setError(null);
            const totalFiles = selectedFiles.length + acceptedFiles.length;

            if (totalFiles > maxFiles) {
                setError(`Maximum ${maxFiles} files allowed`);
                return;
            }

            setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
        },
        [selectedFiles, maxFiles]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
            'image/svg+xml': ['.svg'],
        },
        maxSize: 5 * 1024 * 1024,
        disabled: disabled || uploading,
    });

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setError(null);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('model_type', modelType);
        formData.append('model_id', modelId.toString());

        selectedFiles.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
        });

        try {
            const response = await fetch('/images/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Upload failed');
            }

            const data = await response.json();

            setSelectedFiles([]);

            if (onUploadSuccess && data.images) {
                onUploadSuccess(data.images);
            }

            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={className}>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${
                        isDragActive
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                            : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600'
                    }
                    ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Upload className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    </div>

                    <div>
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                            {isDragActive
                                ? 'Drop images here'
                                : 'Drag & drop images here'}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            or click to browse
                        </p>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        PNG, JPG, WebP, GIF, SVG up to 5MB
                        {maxFiles > 1 && ` (max ${maxFiles} files)`}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mt-3 rounded-md bg-error-50 dark:bg-error-900/20 p-3">
                    <p className="text-sm text-error-600 dark:text-error-400">
                        {error}
                    </p>
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected files ({selectedFiles.length})
                    </p>

                    <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                                        <Upload className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    disabled={uploading}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 disabled:opacity-50"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleUpload}
                        disabled={uploading || disabled}
                        loading={uploading}
                        className="w-full"
                    >
                        Upload {selectedFiles.length} image
                        {selectedFiles.length !== 1 ? 's' : ''}
                    </Button>
                </div>
            )}
        </div>
    );
}
