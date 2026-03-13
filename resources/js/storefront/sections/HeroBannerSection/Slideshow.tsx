import React, { useCallback, useEffect, useState } from 'react';
import type { SectionProps } from '../../types/storefront';
import type { SlideData } from '../../types/storefront';

export function Slideshow({ config }: SectionProps) {
    const slides = (config.slides as SlideData[]) ?? [];
    const overlayOpacity = (config.overlay_opacity as number) ?? 0.4;
    const [activeIndex, setActiveIndex] = useState(0);

    const slideCount = slides.length;

    const goToSlide = useCallback(
        (index: number) => {
            setActiveIndex((index + slideCount) % slideCount);
        },
        [slideCount]
    );

    useEffect(() => {
        if (slideCount <= 1) {
            return;
        }

        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % slideCount);
        }, 5000);

        return () => clearInterval(timer);
    }, [slideCount]);

    if (slideCount === 0) {
        return null;
    }

    return (
        <section
            style={{
                position: 'relative',
                minHeight: '50vh',
                overflow: 'hidden',
            }}
            className="sm:min-h-[70vh]"
        >
            {slides.map((slide, index) => (
                <div
                    key={index}
                    style={{
                        position: index === 0 ? 'relative' : 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        minHeight: '50vh',
                        opacity: index === activeIndex ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        zIndex: index === activeIndex ? 1 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    className={index === 0 ? 'sm:min-h-[70vh]' : ''}
                >
                    {slide.image && (
                        <img
                            src={slide.image}
                            alt=""
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    )}

                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                        }}
                    />

                    <div
                        className="px-4 sm:px-6"
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            textAlign: 'center',
                            maxWidth: 'var(--container-width, 1280px)',
                        }}
                    >
                        {slide.heading && (
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 'clamp(2rem, 5vw, 4rem)',
                                    fontWeight: 700,
                                    lineHeight: 1.1,
                                    color: '#ffffff',
                                    fontFamily: 'var(--font-heading, inherit)',
                                }}
                            >
                                {slide.heading}
                            </h2>
                        )}

                        {slide.subheading && (
                            <p
                                style={{
                                    marginTop: '16px',
                                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                    lineHeight: 1.6,
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontFamily: 'var(--font-body, inherit)',
                                    maxWidth: '640px',
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                }}
                            >
                                {slide.subheading}
                            </p>
                        )}

                        {slide.cta_text && slide.cta_link && (
                            <a
                                href={slide.cta_link}
                                style={{
                                    display: 'inline-block',
                                    marginTop: '32px',
                                    padding: '14px 32px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: 'var(--color-button-foreground, #ffffff)',
                                    backgroundColor: 'var(--color-primary, #6366f1)',
                                    borderRadius: 'var(--radius, 8px)',
                                    textDecoration: 'none',
                                    transition: 'opacity 0.2s ease',
                                    fontFamily: 'var(--font-body, inherit)',
                                }}
                            >
                                {slide.cta_text}
                            </a>
                        )}
                    </div>
                </div>
            ))}

            {slideCount > 1 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2,
                        display: 'flex',
                        gap: '8px',
                    }}
                >
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            style={{
                                width: index === activeIndex ? '32px' : '10px',
                                height: '10px',
                                borderRadius: '5px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor:
                                    index === activeIndex
                                        ? '#ffffff'
                                        : 'rgba(255, 255, 255, 0.5)',
                                transition: 'all 0.3s ease',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
