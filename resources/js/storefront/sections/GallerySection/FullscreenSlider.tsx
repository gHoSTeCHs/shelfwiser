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
        }, 5000);

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
                    aspect-ratio: 16/9;
                }
                @media (min-width: 640px) {
                    #gallery-slider-${sliderId} {
                        aspect-ratio: 16/7;
                    }
                }
                #gallery-slider-${sliderId} .slider-track {
                    display: flex;
                    height: 100%;
                    transition: transform 0.7s ease-in-out;
                }
                #gallery-slider-${sliderId} .slider-slide {
                    min-width: 100%;
                    height: 100%;
                }
            `}</style>
            <div
                id={`gallery-slider-${sliderId}`}
                style={{ borderRadius: 'var(--radius, 8px)' }}
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
                            className="slider-slide group relative shrink-0 cursor-pointer overflow-hidden border-0 bg-transparent p-0"
                        >
                            <img
                                src={image.url}
                                alt={image.alt || ''}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {image.caption && (
                                <div
                                    className="absolute inset-x-0 bottom-0 px-4 py-3 text-left text-sm font-medium text-white sm:px-6 sm:py-4"
                                    style={{
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                    }}
                                >
                                    {image.caption}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrev}
                            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100 sm:left-5 sm:h-12 sm:w-12"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: 'var(--radius, 8px)',
                                border: 'none',
                            }}
                            aria-label="Previous slide"
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
                        <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100 sm:right-5 sm:h-12 sm:w-12"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: 'var(--radius, 8px)',
                                border: 'none',
                            }}
                            aria-label="Next slide"
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
                    </>
                )}
            </div>
        </>
    );
}
