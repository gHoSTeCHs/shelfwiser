import { Inline } from './Inline';
import { Background } from './Background';
import type { SectionProps } from '../../types/storefront';

interface VideoConfig {
    heading?: string;
    video_url: string;
    poster_image?: string;
    autoplay?: boolean;
    muted?: boolean;
    cta_text?: string;
    cta_link?: string;
}

export function VideoSection({ config, variant }: SectionProps) {
    const {
        heading,
        video_url,
        poster_image,
        autoplay,
        muted,
        cta_text,
        cta_link,
    } = config as unknown as VideoConfig;

    if (!video_url) {
        return null;
    }

    if (variant === 'background_loop') {
        return (
            <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
                <Background
                    heading={heading}
                    video_url={video_url}
                    poster_image={poster_image}
                    autoplay={autoplay}
                    muted={muted}
                    cta_text={cta_text}
                    cta_link={cta_link}
                />
            </section>
        );
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <Inline
                    heading={heading}
                    video_url={video_url}
                    poster_image={poster_image}
                    autoplay={autoplay}
                    muted={muted}
                />
            </div>
        </section>
    );
}
