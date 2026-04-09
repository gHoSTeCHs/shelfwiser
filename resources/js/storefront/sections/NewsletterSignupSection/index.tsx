import { Inline } from './Inline';
import { Card } from './Card';
import { PopupTrigger } from './PopupTrigger';
import type { SectionProps } from '../../types/storefront';
import { narrowConfig } from '../../lib/section-helpers';

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
    } = narrowConfig<NewsletterConfig>(config);

    const variantProps = { heading, subheading, placeholder, button_text, shop_slug };

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <style>{`
                @keyframes newsletterFadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div
                className="mx-auto px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {variant === 'popup_trigger' ? (
                    <PopupTrigger {...variantProps} />
                ) : variant === 'stacked' || variant === 'split' ? (
                    <Card {...variantProps} />
                ) : (
                    <Inline {...variantProps} />
                )}
            </div>
        </section>
    );
}
