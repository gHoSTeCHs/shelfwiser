import { useState, useCallback, useEffect, useRef, useId } from 'react';

interface GalleryImage {
    url: string;
    alt?: string;
    caption?: string;
}

interface FullscreenSliderProps {
    images: GalleryImage[];
    onImageClick: (index: number) => void;
}

function NavBtn({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            className="absolute z-10 flex items-center justify-center sm:h-12 sm:w-12"
            style={{
                [direction === 'left' ? 'left' : 'right']: 16,
                top: '50%',
                width: 44,
                height: 44,
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
            </svg>
        </button>
    );
}

export function FullscreenSlider({ images, onImageClick }: FullscreenSliderProps) {
    const sliderId = useId().replace(/:/g, '');
    const [activeIndex, setActiveIndex] = useState(0);
    const isPausedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }, [images.length]);

    useEffect(() => {
        if (images.length <= 1) return;
        timerRef.current = setInterval(() => {
            if (!isPausedRef.current) {
                setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }
        }, 5500);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
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
                #gallery-slider-${sliderId} {
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    aspect-ratio: 16/10;
                    background-color: var(--color-surface, #f3f4f6);
                }
                @media (min-width: 640px) {
                    #gallery-slider-${sliderId} {
                        aspect-ratio: 16/7;
                    }
                }
                #gallery-slider-${sliderId} .slider-track {
                    display: flex;
                    height: 100%;
                    transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
                }
                #gallery-slider-${sliderId} .slider-slide {
                    min-width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    border: 0;
                    padding: 0;
                    cursor: pointer;
                    background-color: var(--color-surface, #f3f4f6);
                }
                #gallery-slider-${sliderId} .slider-slide img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            `}</style>
            <div
                id={`gallery-slider-${sliderId}`}
                style={{ borderRadius: 'calc(var(--radius, 8px) * 1.5)' }}
                role="region"
                aria-label="Image slider"
                onMouseEnter={() => { isPausedRef.current = true; }}
                onMouseLeave={() => { isPausedRef.current = false; }}
            >
                <div
                    className="slider-track"
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => onImageClick(index)}
                            className="slider-slide"
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
                                        padding: '40px 32px 36px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
                                        textAlign: 'left',
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 'clamp(14px, 1.8vw, 18px)',
                                            fontWeight: 700,
                                            color: '#fff',
                                            fontFamily: 'var(--font-heading, sans-serif)',
                                            letterSpacing: '-0.015em',
                                            maxWidth: '60ch',
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
                            style={{ bottom: 20 }}
                        >
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    style={{
                                        width: index === activeIndex ? 32 : 9,
                                        height: 9,
                                        borderRadius: 5,
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        backgroundColor: index === activeIndex
                                            ? '#fff'
                                            : 'rgba(255,255,255,0.45)',
                                        transition: 'width 0.3s ease, background-color 0.3s ease',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Counter */}
                        <div
                            className="absolute z-10 px-3 py-1.5 text-xs font-bold"
                            style={{
                                top: 20,
                                right: 20,
                                color: '#fff',
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                borderRadius: 999,
                                fontFamily: 'var(--font-body, sans-serif)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            {activeIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
