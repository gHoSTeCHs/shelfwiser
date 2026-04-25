import { useState } from 'react';
import { sanitizeUrl } from '../../lib/sanitize-html';

interface BackgroundProps {
    heading?: string;
    subheading?: string;
    video_url: string;
    poster_image?: string;
    autoplay?: boolean;
    muted?: boolean;
    cta_text?: string;
    cta_link?: string;
}

function isDirectVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export function Background({
    heading,
    subheading,
    video_url,
    poster_image,
    muted,
    cta_text,
    cta_link,
}: BackgroundProps) {
    const isDirect = isDirectVideo(video_url);
    const [ctaHovered, setCtaHovered] = useState(false);
    const safeCtaLink = sanitizeUrl(cta_link);

    return (
        <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
                minHeight: 'clamp(420px, 60vh, 640px)',
                borderRadius: 'calc(var(--radius, 8px) * 1.5)',
            }}
        >
            {/* Video / poster / fallback */}
            {isDirect ? (
                <video
                    src={video_url}
                    poster={poster_image}
                    autoPlay
                    loop
                    muted={muted !== false}
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : poster_image ? (
                <img
                    src={poster_image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor: 'var(--color-primary, #e94560)' }}
                />
            )}

            {/* Multi-stop overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
                        to bottom,
                        rgba(0,0,0,0.2) 0%,
                        rgba(0,0,0,0.35) 40%,
                        rgba(0,0,0,0.65) 100%
                    )`,
                }}
            />

            {/* Live badge */}
            <div
                className="absolute flex items-center gap-2 px-3 py-1.5"
                style={{
                    top: 24,
                    left: 24,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                }}
            >
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary, #e94560)',
                        animation: 'videoPulse 2s ease-in-out infinite',
                    }}
                />
                <style>{`
                    @keyframes videoPulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(0.9); }
                    }
                `}</style>
                <span
                    className="text-[11px] font-bold uppercase"
                    style={{
                        color: '#fff',
                        letterSpacing: '0.1em',
                        fontFamily: 'var(--font-body, sans-serif)',
                    }}
                >
                    Watch
                </span>
            </div>

            {/* Content */}
            <div
                className="relative z-10 flex flex-col items-center text-center"
                style={{ padding: '64px 24px', maxWidth: 880 }}
            >
                {heading && (
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'clamp(1.75rem, 5vw, 3.25rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                            color: '#fff',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                        }}
                    >
                        {heading}
                    </h2>
                )}

                {subheading && (
                    <p
                        className="mx-auto"
                        style={{
                            marginTop: 16,
                            maxWidth: 620,
                            fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                            color: 'rgba(255,255,255,0.85)',
                            fontFamily: 'var(--font-body, sans-serif)',
                            lineHeight: 1.65,
                            textShadow: '0 1px 8px rgba(0,0,0,0.3)',
                        }}
                    >
                        {subheading}
                    </p>
                )}

                {cta_text && safeCtaLink && (
                    <a
                        href={safeCtaLink}
                        className="inline-block px-8 py-4 text-sm font-bold"
                        style={{
                            marginTop: 32,
                            backgroundColor: ctaHovered ? '#fff' : 'var(--color-primary, #e94560)',
                            color: ctaHovered ? 'var(--color-foreground, #111)' : '#fff',
                            borderRadius: 'var(--radius, 8px)',
                            fontFamily: 'var(--font-body, sans-serif)',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            boxShadow: ctaHovered
                                ? '0 12px 30px -8px rgba(0,0,0,0.3)'
                                : '0 6px 20px -6px rgba(0,0,0,0.25)',
                            transform: ctaHovered ? 'translateY(-2px)' : 'translateY(0)',
                            transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                        onMouseEnter={() => setCtaHovered(true)}
                        onMouseLeave={() => setCtaHovered(false)}
                    >
                        {cta_text}
                    </a>
                )}
            </div>
        </div>
    );
}
