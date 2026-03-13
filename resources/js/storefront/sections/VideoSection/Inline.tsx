interface InlineProps {
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

export function Inline({ heading, video_url, poster_image, autoplay, muted }: InlineProps) {
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

            <div
                className="relative w-full overflow-hidden"
                style={{
                    borderRadius: 'var(--radius, 8px)',
                    aspectRatio: '16/9',
                    backgroundColor: 'var(--color-surface, #000)',
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
                        style={{ color: 'var(--color-text-muted, #999)' }}
                    >
                        <p className="text-sm">Unsupported video format</p>
                    </div>
                )}
            </div>
        </div>
    );
}
