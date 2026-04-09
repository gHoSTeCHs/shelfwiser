import { useState, useCallback, useEffect, useId } from 'react';

interface GalleryImage {
    url: string;
    alt?: string;
    caption?: string;
}

interface CarouselProps {
    images: GalleryImage[];
    onImageClick: (index: number) => void;
}

function NavBtn({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            className="absolute z-10 flex h-11 w-11 items-center justify-center"
            style={{
                [direction === 'left' ? 'left' : 'right']: 16,
                top: '50%',
                transform: hovered
                    ? 'translateY(-50%) scale(1.05)'
                    : 'translateY(-50%) scale(1)',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: hovered
                    ? 'var(--color-primary, #e94560)'
                    : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: hovered ? '#fff' : 'var(--color-foreground, #111)',
                cursor: 'pointer',
                boxShadow: '0 4px 14px -4px rgba(0,0,0,0.25)',
                transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
            </svg>
        </button>
    );
}

export function Carousel({ images, onImageClick }: CarouselProps) {
    const carouselId = useId().replace(/:/g, '');
    const [activeIndex, setActiveIndex] = useState(0);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }, [images.length]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'ArrowRight') goToNext();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [goToPrev, goToNext]);

    return (
        <>
            <style>{`
                #gallery-carousel-${carouselId} {
                    position: relative;
                    overflow: hidden;
                }
                #gallery-carousel-${carouselId} .carousel-track {
                    display: flex;
                    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
                }
                #gallery-carousel-${carouselId} .carousel-slide {
                    min-width: 100%;
                    aspect-ratio: 4/3;
                    position: relative;
                    overflow: hidden;
                    background-color: var(--color-surface, #f3f4f6);
                    border: 0;
                    padding: 0;
                    cursor: pointer;
                }
                @media (min-width: 640px) {
                    #gallery-carousel-${carouselId} .carousel-slide {
                        aspect-ratio: 16/9;
                    }
                }
                #gallery-carousel-${carouselId} .carousel-slide img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            `}</style>
            <div
                id={`gallery-carousel-${carouselId}`}
                style={{ borderRadius: 'calc(var(--radius, 8px) * 1.5)' }}
                role="region"
                aria-label="Image carousel"
            >
                <div
                    className="carousel-track"
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => onImageClick(index)}
                            className="carousel-slide"
                            aria-label={image.alt || `Open image ${index + 1}`}
                        >
                            <img src={image.url} alt={image.alt || ''} loading="lazy" />
                            {image.caption && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        padding: '28px 24px 24px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)',
                                        textAlign: 'left',
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#fff',
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {image.caption}
                                    </p>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {images.length > 1 && (
                    <>
                        <NavBtn direction="left" onClick={goToPrev} />
                        <NavBtn direction="right" onClick={goToNext} />

                        {/* Pill dot indicators */}
                        <div
                            className="absolute left-1/2 z-10 flex -translate-x-1/2 gap-2"
                            style={{ bottom: 18 }}
                        >
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    style={{
                                        width: index === activeIndex ? 28 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        backgroundColor: index === activeIndex
                                            ? '#fff'
                                            : 'rgba(255,255,255,0.5)',
                                        transition: 'width 0.3s ease, background-color 0.3s ease',
                                    }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
