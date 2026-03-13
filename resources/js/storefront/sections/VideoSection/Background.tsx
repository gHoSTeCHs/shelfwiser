interface BackgroundProps {
    heading?: string;
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

export function Background({ heading, video_url, poster_image, muted, cta_text, cta_link }: BackgroundProps) {
    const isDirect = isDirectVideo(video_url);

    return (
        <div
            className="relative flex min-h-[400px] items-center justify-center overflow-hidden sm:min-h-[500px]"
        >
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
                    style={{ backgroundColor: 'var(--color-primary, #1a1a1a)' }}
                />
            )}

            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
                }}
            />

            <div className="relative z-10 px-4 py-16 text-center sm:px-6">
                {heading && (
                    <h2
                        className="text-2xl font-bold text-white sm:text-4xl lg:text-5xl"
                        style={{
                            fontFamily: 'var(--font-heading, sans-serif)',
                            fontWeight: 'var(--font-heading-weight, 700)',
                        }}
                    >
                        {heading}
                    </h2>
                )}

                {cta_text && cta_link && (
                    <a
                        href={cta_link}
                        className="mt-8 inline-block px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                        style={{
                            backgroundColor: 'var(--color-primary, rgba(255,255,255,0.2))',
                            borderRadius: 'var(--radius, 8px)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {cta_text}
                    </a>
                )}
            </div>
        </div>
    );
}
