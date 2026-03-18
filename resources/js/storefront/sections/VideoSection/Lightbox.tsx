import { useState, useEffect, useCallback } from 'react';

interface LightboxProps {
    heading?: string;
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

export function Lightbox({ heading, video_url, poster_image, autoplay, muted }: LightboxProps) {
    const [isOpen, setIsOpen] = useState(false);

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
        <div className="text-center">
            {heading && (
                <h2
                    className="mb-6 text-xl font-bold sm:text-2xl"
                    style={{
                        color: 'var(--color-text, #1a1a1a)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                        fontWeight: 'var(--font-heading-weight, 700)',
                    }}
                >
                    {heading}
                </h2>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="group relative mx-auto block w-full cursor-pointer overflow-hidden"
                style={{
                    borderRadius: 'var(--radius, 8px)',
                    aspectRatio: '16/9',
                    backgroundColor: 'var(--color-surface, #000)',
                }}
                aria-label="Play video"
            >
                {poster_image ? (
                    <img
                        src={poster_image}
                        alt={heading || 'Video thumbnail'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div
                        className="h-full w-full"
                        style={{ backgroundColor: 'var(--color-surface, #1a1a1a)' }}
                    />
                )}

                <div
                    className="absolute inset-0 transition-opacity group-hover:opacity-80"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
                />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-110 sm:h-20 sm:w-20"
                        style={{
                            backgroundColor: 'var(--color-primary, rgba(255,255,255,0.9))',
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="var(--color-primary-foreground, #1a1a1a)"
                            stroke="none"
                        >
                            <polygon points="6 3 20 12 6 21" />
                        </svg>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                    onClick={() => setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Video lightbox"
                >
                    <button
                        onClick={() => setIsOpen(false)}
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

                    <div
                        className="relative w-full max-w-4xl"
                        style={{ aspectRatio: '16/9' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {embedUrl ? (
                            <iframe
                                src={`${embedUrl}?autoplay=1${muted ? '&mute=1' : ''}`}
                                title={heading || 'Video'}
                                className="h-full w-full border-0"
                                style={{ borderRadius: 'var(--radius, 8px)' }}
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
                                style={{ borderRadius: 'var(--radius, 8px)' }}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center"
                                style={{ color: 'var(--color-text-muted, #999)' }}
                            >
                                <p className="text-sm">Unsupported video format</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
