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
                    transition: transform 0.5s ease-in-out;
                }
                #gallery-carousel-${carouselId} .carousel-slide {
                    min-width: 100%;
                    aspect-ratio: 4/3;
                }
                @media (min-width: 640px) {
                    #gallery-carousel-${carouselId} .carousel-slide {
                        aspect-ratio: 16/9;
                    }
                }
            `}</style>
            <div
                id={`gallery-carousel-${carouselId}`}
                style={{ borderRadius: 'var(--radius, 8px)' }}
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
                            className="carousel-slide group relative shrink-0 cursor-pointer overflow-hidden border-0 bg-transparent p-0"
                        >
                            <img
                                src={image.url}
                                alt={image.alt || ''}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {image.caption && (
                                <div
                                    className="absolute inset-x-0 bottom-0 px-3 py-2 text-left text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    style={{
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
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
                            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: 'var(--radius, 8px)',
                                border: 'none',
                            }}
                            aria-label="Previous slide"
                        >
                            <svg
                                width="20"
                                height="20"
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
                            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-white opacity-70 transition-opacity hover:opacity-100"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderRadius: 'var(--radius, 8px)',
                                border: 'none',
                            }}
                            aria-label="Next slide"
                        >
                            <svg
                                width="20"
                                height="20"
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

                        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    className="h-2.5 w-2.5 border-0 p-0 transition-opacity duration-300"
                                    style={{
                                        borderRadius: '50%',
                                        backgroundColor: index === activeIndex
                                            ? 'var(--color-primary, #2563eb)'
                                            : 'rgba(255, 255, 255, 0.6)',
                                        opacity: index === activeIndex ? 1 : 0.7,
                                    }}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
