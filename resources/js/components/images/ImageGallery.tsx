import React, { useState } from 'react';
import { Image as ImageType } from '@/types/image';
import { Star, Trash2, MoveUp, MoveDown } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { router } from '@inertiajs/react';

interface ImageGalleryProps {
    images: ImageType[];
    modelType: 'Product' | 'ProductVariant' | 'Service';
    modelId: number;
    canManage?: boolean;
    showPlaceholder?: boolean;
    placeholderUrl?: string;
}

/**
 * ImageGallery Component
 * Displays images with management controls (delete, set primary, reorder)
 */
export default function ImageGallery({
    images,
    modelType,
    modelId,
    canManage = false,
    showPlaceholder = true,
    placeholderUrl = 'https://placehold.co/600x400',
}: ImageGalleryProps) {
    const [deleting, setDeleting] = useState<number | null>(null);

    const primaryImage = images.find((img) => img.is_primary);
    const otherImages = images.filter((img) => !img.is_primary);

    const handleDelete = async (imageId: number) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        setDeleting(imageId);

        try {
            await fetch(`/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
            });

            router.reload();
        } catch (err) {
            console.error('Failed to delete image:', err);
            alert('Failed to delete image');
        } finally {
            setDeleting(null);
        }
    };

    const handleSetPrimary = async (imageId: number) => {
        try {
            await fetch(`/images/${imageId}/set-primary`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            router.reload();
        } catch (err) {
            console.error('Failed to set primary image:', err);
            alert('Failed to set primary image');
        }
    };

    const handleReorder = async (imageId: number, direction: 'up' | 'down') => {
        const currentIndex = images.findIndex((img) => img.id === imageId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= images.length) return;

        const reorderedImages = [...images];
        [reorderedImages[currentIndex], reorderedImages[newIndex]] = [
            reorderedImages[newIndex],
            reorderedImages[currentIndex],
        ];

        try {
            await fetch('/images/reorder', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model_type: modelType,
                    model_id: modelId,
                    image_ids: reorderedImages.map((img) => img.id),
                }),
            });

            router.reload();
        } catch (err) {
            console.error('Failed to reorder images:', err);
            alert('Failed to reorder images');
        }
    };

    if (images.length === 0) {
        if (!showPlaceholder) return null;

        return (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
                <div className="text-center">
                    <img
                        src={placeholderUrl}
                        alt="Placeholder"
                        className="mx-auto h-48 w-48 rounded-lg object-cover opacity-50"
                    />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        No images uploaded
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Primary Image */}
            {primaryImage && (
                <div className="relative">
                    <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <img
                            src={primaryImage.url || primaryImage.path}
                            alt={primaryImage.alt_text || 'Primary image'}
                            className="h-64 w-full object-cover"
                        />

                        <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-2.5 py-1 text-xs font-medium text-white">
                                <Star className="h-3 w-3 fill-current" />
                                Primary
                            </span>
                        </div>

                        {canManage && (
                            <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(primaryImage.id)}
                                    disabled={deleting === primaryImage.id}
                                    loading={deleting === primaryImage.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {primaryImage.caption && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {primaryImage.caption}
                        </p>
                    )}
                </div>
            )}

            {/* Other Images */}
            {otherImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {otherImages.map((image, index) => (
                        <div key={image.id} className="relative group">
                            <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                <img
                                    src={image.url || image.path}
                                    alt={image.alt_text || `Image ${index + 1}`}
                                    className="aspect-square w-full object-cover"
                                />

                                {canManage && (
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                handleSetPrimary(image.id)
                                            }
                                            title="Set as primary"
                                        >
                                            <Star className="h-4 w-4" />
                                        </Button>

                                        {index > 0 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    handleReorder(image.id, 'up')
                                                }
                                                title="Move up"
                                            >
                                                <MoveUp className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {index < otherImages.length - 1 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    handleReorder(
                                                        image.id,
                                                        'down'
                                                    )
                                                }
                                                title="Move down"
                                            >
                                                <MoveDown className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(image.id)}
                                            disabled={deleting === image.id}
                                            loading={deleting === image.id}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {image.caption && (
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {image.caption}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
