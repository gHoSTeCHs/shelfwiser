interface InlineProps {
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

export function Inline({ heading, subheading, video_url, poster_image, autoplay, muted }: InlineProps) {
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

            <div
                className="relative w-full overflow-hidden"
                style={{
                    borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                    aspectRatio: '16/9',
                    backgroundColor: '#000',
                    boxShadow: '0 20px 60px -20px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.08)',
                }}
            >
                {embedUrl ? (
                    <iframe
                        src={`${embedUrl}${autoplay ? '?autoplay=1' : ''}${muted ? (autoplay ? '&mute=1' : '?mute=1') : ''}`}
                        title={heading || 'Video'}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : isDirect ? (
                    <video
                        src={video_url}
                        poster={poster_image}
                        controls
                        autoPlay={autoplay}
                        muted={muted}
                        playsInline
                        className="absolute inset-0 h-full w-full object-contain"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                        <p className="text-sm font-medium">Unsupported video format</p>
                    </div>
                )}
            </div>
        </div>
    );
}
