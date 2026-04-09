import { useCallback, useEffect, useState } from 'react';
import type { SectionProps, SlideData } from '../../types/storefront';

export function Slideshow({ config }: SectionProps) {
    const slides = (config.slides as SlideData[]) ?? [];
    const overlayOpacity = (config.overlay_opacity as number) ?? 0.45;
    const [activeIndex, setActiveIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const slideCount = slides.length;

    const goToSlide = useCallback(
        (index: number) => {
            if (isTransitioning) return;
            setIsTransitioning(true);
            setActiveIndex((index + slideCount) % slideCount);
            setTimeout(() => setIsTransitioning(false), 900);
        },
        [slideCount, isTransitioning]
    );

    useEffect(() => {
        if (slideCount <= 1) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % slideCount);
        }, 6000);
        return () => clearInterval(timer);
    }, [slideCount]);

    if (slideCount === 0) return null;

    return (
        <section className="relative min-h-[60vh] overflow-hidden sm:min-h-[85vh]">
            {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                    <div
                        key={index}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            opacity: isActive ? 1 : 0,
                            transition: 'opacity 0.9s ease-in-out',
                            zIndex: isActive ? 1 : 0,
                            ...(index === 0 ? { position: 'relative', minHeight: '60vh' } : {}),
                        }}
                    >
                        {slide.image && (
                            <img
                                src={slide.image}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-cover"
                                style={{
                                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'transform 6s ease-out',
                                }}
                            />
                        )}

                        {!slide.image && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `
                                        radial-gradient(ellipse 80% 60% at ${20 + index * 20}% ${80 - index * 15}%, var(--color-primary, #047857) 0%, transparent 60%),
                                        radial-gradient(ellipse 60% 50% at ${80 - index * 15}% ${20 + index * 20}%, var(--color-secondary, #064E3B) 0%, transparent 50%),
                                        linear-gradient(${135 + index * 30}deg, #0a0a0a 0%, var(--color-secondary, #064E3B) 100%)
                                    `,
                                }}
                            />
                        )}

                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.3}) 0%, rgba(0,0,0,${overlayOpacity}) 40%, rgba(0,0,0,${overlayOpacity * 1.1}) 100%)`,
                            }}
                        />

                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                                backgroundSize: '128px 128px',
                            }}
                        />

                        <div
                            className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8"
                            style={{
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'translateY(0)' : 'translateY(24px)',
                                transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
                            }}
                        >
                            {slide.heading && (
                                <h2
                                    className="text-balance"
                                    style={{
                                        margin: 0,
                                        fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
                                        fontWeight: 800,
                                        lineHeight: 1.05,
                                        letterSpacing: '-0.03em',
                                        color: '#ffffff',
                                        fontFamily: 'var(--font-heading, inherit)',
                                        textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {slide.heading}
                                </h2>
                            )}

                            {slide.subheading && (
                                <p
                                    style={{
                                        marginTop: '1.25rem',
                                        fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
                                        lineHeight: 1.7,
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        fontFamily: 'var(--font-body, inherit)',
                                        maxWidth: '540px',
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        fontWeight: 400,
                                    }}
                                >
                                    {slide.subheading}
                                </p>
                            )}

                            {slide.cta_text && slide.cta_link && (
                                <a
                                    href={slide.cta_link}
                                    className="group mt-8 inline-flex items-center gap-2.5 sm:mt-10"
                                    style={{
                                        padding: '16px 36px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        letterSpacing: '0.02em',
                                        color: 'var(--color-button-foreground, #ffffff)',
                                        backgroundColor: 'var(--color-primary, #047857)',
                                        borderRadius: 'var(--radius, 8px)',
                                        textDecoration: 'none',
                                        fontFamily: 'var(--font-body, inherit)',
                                        boxShadow: '0 4px 15px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    {slide.cta_text}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                );
            })}

            {slideCount > 1 && (
                <>
                    <button
                        onClick={() => goToSlide(activeIndex - 1)}
                        className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:scale-110 sm:left-6"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                        }}
                        aria-label="Previous slide"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        onClick={() => goToSlide(activeIndex + 1)}
                        className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:scale-110 sm:right-6"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                        }}
                        aria-label="Next slide"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-8">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className="relative h-2 overflow-hidden rounded-full transition-all duration-500"
                                style={{
                                    width: index === activeIndex ? '36px' : '10px',
                                    backgroundColor: index === activeIndex ? 'transparent' : 'rgba(255,255,255,0.4)',
                                    padding: 0,
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {index === activeIndex && (
                                    <>
                                        <div className="absolute inset-0 rounded-full bg-white/30" />
                                        <div
                                            className="absolute inset-0 rounded-full bg-white"
                                            style={{
                                                animation: 'slideProgress 6s linear forwards',
                                                transformOrigin: 'left',
                                            }}
                                        />
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideProgress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
            `}</style>
        </section>
    );
}
