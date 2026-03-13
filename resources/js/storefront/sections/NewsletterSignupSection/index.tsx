import { Inline } from './Inline';
import { Card } from './Card';
import type { SectionProps } from '../../types/storefront';

interface NewsletterConfig {
    heading: string;
    subheading?: string;
    placeholder: string;
    button_text: string;
    shop_slug: string;
}

export function NewsletterSignupSection({ config, variant }: SectionProps) {
    const {
        heading,
        subheading,
        placeholder,
        button_text,
        shop_slug,
    } = config as unknown as NewsletterConfig;

    const variantProps = { heading, subheading, placeholder, button_text, shop_slug };

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {variant === 'stacked' || variant === 'split' ? (
                    <Card {...variantProps} />
                ) : (
                    <Inline {...variantProps} />
                )}
            </div>
        </section>
    );
}
