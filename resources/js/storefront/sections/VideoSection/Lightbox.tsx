import { useState, useEffect, useCallback } from 'react';

interface LightboxProps {
    heading?: string;
    subheading?: string;
    video_url: string;
    poster_image?: string;
    autoplay?: boolean;
    muted?: boolean;
}

function getEmbedUrl(url: string): string | null {
    const youtubeMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    );
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
}

function isDirectVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export function Lightbox({ heading, subheading, video_url, poster_image, muted }: LightboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [thumbHovered, setThumbHovered] = useState(false);
    const [closeHovered, setCloseHovered] = useState(false);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        },
        [],
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    const embedUrl = getEmbedUrl(video_url);
    const isDirect = isDirectVideo(video_url);

    return (
        <div className="mx-auto max-w-5xl text-center">
            {(heading || subheading) && (
                <div style={{ marginBottom: 36 }}>
                    {heading && (
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.15,
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

            {/* Poster trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative mx-auto block w-full overflow-hidden"
                style={{
                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                    aspectRatio: '16/9',
                    backgroundColor: '#000',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    boxShadow: '0 20px 60px -20px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={() => setThumbHovered(true)}
                onMouseLeave={() => setThumbHovered(false)}
                aria-label="Play video"
            >
                {poster_image ? (
                    <img
                        src={poster_image}
                        alt={heading || 'Video thumbnail'}
                        className="h-full w-full object-cover"
                        style={{
                            transform: thumbHovered ? 'scale(1.04)' : 'scale(1)',
                            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    />
                ) : (
                    <div
                        className="h-full w-full"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary, #e94560) 0%, var(--color-foreground, #111) 100%)',
                        }}
                    />
                )}

                {/* Multi-stop overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(
                            to bottom,
                            rgba(0,0,0,0.15) 0%,
                            rgba(0,0,0,0.3) 50%,
                            rgba(0,0,0,0.55) 100%
                        )`,
                    }}
                />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="relative flex items-center justify-center"
                        style={{
                            width: thumbHovered ? 92 : 80,
                            height: thumbHovered ? 92 : 80,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary, #e94560)',
                            boxShadow: thumbHovered
                                ? '0 12px 40px -8px rgba(0,0,0,0.45), 0 0 0 12px rgba(255,255,255,0.08)'
                                : '0 8px 24px -4px rgba(0,0,0,0.35), 0 0 0 8px rgba(255,255,255,0.06)',
                            transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="#fff"
                            stroke="none"
                            style={{ marginLeft: 4 }}
                        >
                            <polygon points="6 3 20 12 6 21" />
                        </svg>
                    </div>
                </div>

                {/* Duration/label badge — bottom-left */}
                <div
                    className="absolute flex items-center gap-2 px-3 py-1.5"
                    style={{
                        bottom: 18,
                        left: 18,
                        borderRadius: 999,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    <span
                        className="text-[11px] font-bold uppercase"
                        style={{
                            color: '#fff',
                            letterSpacing: '0.1em',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        Play Video
                    </span>
                </div>
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.92)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        animation: 'videoLightboxIn 0.25s ease forwards',
                    }}
                    onClick={() => setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Video lightbox"
                >
                    <style>{`
                        @keyframes videoLightboxIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes videoModalIn {
                            from { opacity: 0; transform: scale(0.96); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute z-10 flex h-11 w-11 items-center justify-center"
                        style={{
                            top: 20,
                            right: 20,
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: closeHovered
                                ? 'var(--color-primary, #e94560)'
                                : 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            color: '#fff',
                            cursor: 'pointer',
                            transform: closeHovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={() => setCloseHovered(true)}
                        onMouseLeave={() => setCloseHovered(false)}
                        aria-label="Close video"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <div
                        className="relative w-full max-w-5xl"
                        style={{
                            aspectRatio: '16/9',
                            animation: 'videoModalIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {embedUrl ? (
                            <iframe
                                src={`${embedUrl}?autoplay=1${muted ? '&mute=1' : ''}`}
                                title={heading || 'Video'}
                                className="h-full w-full border-0"
                                style={{
                                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                                    boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : isDirect ? (
                            <video
                                src={video_url}
                                poster={poster_image}
                                controls
                                autoPlay
                                muted={muted}
                                playsInline
                                className="h-full w-full object-contain"
                                style={{
                                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                                    backgroundColor: '#000',
                                }}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center"
                                style={{
                                    color: 'rgba(255,255,255,0.6)',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                                }}
                            >
                                <p className="text-sm font-medium">Unsupported video format</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
