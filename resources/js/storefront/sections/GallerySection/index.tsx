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
    subheading?: string;
    images: GalleryImage[];
    columns?: number;
}

function LightboxButton({
    onClick,
    position,
    label,
    children,
}: {
    onClick: (e: React.MouseEvent) => void;
    position: 'close' | 'prev' | 'next';
    label: string;
    children: React.ReactNode;
}) {
    const [hovered, setHovered] = useState(false);

    const positionStyle: React.CSSProperties =
        position === 'close'
            ? { top: 20, right: 20 }
            : position === 'prev'
              ? { left: 20, top: '50%', transform: hovered ? 'translateY(-50%) scale(1.05)' : 'translateY(-50%) scale(1)' }
              : { right: 20, top: '50%', transform: hovered ? 'translateY(-50%) scale(1.05)' : 'translateY(-50%) scale(1)' };

    return (
        <button
            onClick={onClick}
            className="absolute z-10 flex h-11 w-11 items-center justify-center"
            style={{
                ...positionStyle,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: hovered
                    ? 'var(--color-primary, #e94560)'
                    : 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={label}
        >
            {children}
        </button>
    );
}

function Lightbox({
    image,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
    current,
    total,
}: {
    image: GalleryImage;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    current: number;
    total: number;
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            style={{
                backgroundColor: 'rgba(0,0,0,0.92)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animation: 'galleryLightboxIn 0.25s ease forwards',
            }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
        >
            <style>{`
                @keyframes galleryLightboxIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes galleryImageIn {
                    from { opacity: 0; transform: scale(0.97); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>

            {/* Counter */}
            <div
                className="absolute left-6 top-6 z-10 px-3 py-1.5 text-xs font-bold"
                style={{
                    color: 'rgba(255,255,255,0.85)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 999,
                    fontFamily: 'var(--font-body, sans-serif)',
                    letterSpacing: '0.04em',
                }}
            >
                {current + 1} / {total}
            </div>

            <LightboxButton onClick={onClose} position="close" label="Close lightbox">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </LightboxButton>

            {hasPrev && (
                <LightboxButton
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    position="prev"
                    label="Previous image"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </LightboxButton>
            )}

            {hasNext && (
                <LightboxButton
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    position="next"
                    label="Next image"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </LightboxButton>
            )}

            <div
                className="flex flex-col items-center"
                style={{
                    maxHeight: '85vh',
                    maxWidth: '90vw',
                    animation: 'galleryImageIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={image.url}
                    alt={image.alt || ''}
                    className="max-h-[80vh] max-w-full object-contain"
                    style={{ borderRadius: 'calc(var(--radius, 8px) * 0.5)' }}
                />
                {image.caption && (
                    <p
                        className="mt-5 max-w-2xl text-center text-sm font-medium"
                        style={{
                            color: 'rgba(255,255,255,0.85)',
                            fontFamily: 'var(--font-body, sans-serif)',
                            letterSpacing: '-0.005em',
                        }}
                    >
                        {image.caption}
                    </p>
                )}
            </div>
        </div>
    );
}

export function GallerySection({ config, variant }: SectionProps) {
    const { heading, subheading, images, columns } = narrowConfig<GalleryConfig>(config);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!images || images.length === 0) return null;

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
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {(heading || subheading) && (
                    <div style={{ textAlign: 'center', marginBottom: 44 }}>
                        {heading && (
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                        textTransform: 'var(--heading-transform, none)' as React.CSSProperties['textTransform'],
                                    color: 'var(--color-foreground, #1a1a1a)',
                                    fontFamily: 'var(--font-heading, sans-serif)',
                                }}
                            >
                                {heading}
                            </h2>
                        )}
                        {subheading && (
                            <p
                                style={{
                                    marginTop: 10,
                                    fontSize: '1.05rem',
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    fontFamily: 'var(--font-body, sans-serif)',
                                }}
                            >
                                {subheading}
                            </p>
                        )}
                    </div>
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
                    current={lightboxIndex}
                    total={images.length}
                />
            )}
        </section>
    );
}
