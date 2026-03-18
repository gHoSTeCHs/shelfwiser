import { useState, useEffect, useCallback } from 'react';
import { Grid } from './Grid';
import { Masonry } from './Masonry';
import { Carousel } from './Carousel';
import { FullscreenSlider } from './FullscreenSlider';
import type { SectionProps } from '../../types/storefront';
import { narrowConfig } from '../../lib/section-helpers';

interface GalleryImage {
    url: string;
    alt?: string;
    caption?: string;
}

interface GalleryConfig {
    heading?: string;
    images: GalleryImage[];
    columns?: number;
}

function Lightbox({
    image,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
}: {
    image: GalleryImage;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
            if (e.key === 'ArrowRight' && hasNext) onNext();
        },
        [onClose, onPrev, onNext, hasPrev, hasNext],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
        >
            <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100"
                aria-label="Close lightbox"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100"
                    aria-label="Previous image"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}

            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100"
                    aria-label="Next image"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}

            <div
                className="max-h-[85vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={image.url}
                    alt={image.alt || ''}
                    className="max-h-[85vh] max-w-full object-contain"
                />
                {image.caption && (
                    <p className="mt-3 text-center text-sm text-white opacity-80">
                        {image.caption}
                    </p>
                )}
            </div>
        </div>
    );
}

export function GallerySection({ config, variant }: SectionProps) {
    const { heading, images, columns } = narrowConfig<GalleryConfig>(config);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!images || images.length === 0) {
        return null;
    }

    function openLightbox(index: number) {
        setLightboxIndex(index);
    }

    function closeLightbox() {
        setLightboxIndex(null);
    }

    function goToPrev() {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }

    function goToNext() {
        setLightboxIndex((prev) =>
            prev !== null && prev < images.length - 1 ? prev + 1 : prev,
        );
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {heading && (
                    <h2
                        className="mb-8 text-xl font-bold sm:text-2xl"
                        style={{
                            color: 'var(--color-text, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            fontWeight: 'var(--font-heading-weight, 700)',
                        }}
                    >
                        {heading}
                    </h2>
                )}

                {variant === 'masonry' ? (
                    <Masonry
                        images={images}
                        columns={columns}
                        onImageClick={openLightbox}
                    />
                ) : variant === 'carousel' ? (
                    <Carousel
                        images={images}
                        onImageClick={openLightbox}
                    />
                ) : variant === 'fullscreen_slider' ? (
                    <FullscreenSlider
                        images={images}
                        onImageClick={openLightbox}
                    />
                ) : (
                    <Grid
                        images={images}
                        columns={columns}
                        onImageClick={openLightbox}
                    />
                )}
            </div>

            {lightboxIndex !== null && images[lightboxIndex] && (
                <Lightbox
                    image={images[lightboxIndex]}
                    onClose={closeLightbox}
                    onPrev={goToPrev}
                    onNext={goToNext}
                    hasPrev={lightboxIndex > 0}
                    hasNext={lightboxIndex < images.length - 1}
                />
            )}
        </section>
    );
}
