import { useState } from 'react';
import type { SectionProps } from '../types/storefront';

interface AnnouncementBarConfig {
    text: string;
    link?: string;
    background_color?: string;
    text_color?: string;
    is_dismissible?: boolean;
}

export function AnnouncementBarSection({ config }: SectionProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const {
        text,
        link,
        background_color,
        text_color,
        is_dismissible,
    } = config as unknown as AnnouncementBarConfig;

    if (isDismissed || !text) {
        return null;
    }

    const bgColor = background_color || 'var(--color-primary, #1a1a1a)';
    const txtColor = text_color || 'var(--color-primary-foreground, #ffffff)';

    const content = link ? (
        <a
            href={link}
            className="underline-offset-2 hover:underline"
            style={{ color: txtColor }}
        >
            {text}
        </a>
    ) : (
        <span>{text}</span>
    );

    return (
        <div
            className="relative w-full px-4 py-2.5 text-center text-sm font-medium"
            style={{
                backgroundColor: bgColor,
                color: txtColor,
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            {content}
            {is_dismissible && (
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
                    style={{ color: txtColor }}
                    aria-label="Dismiss announcement"
                >
                    <svg
                        width="14"
                        height="14"
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
            )}
        </div>
    );
}
