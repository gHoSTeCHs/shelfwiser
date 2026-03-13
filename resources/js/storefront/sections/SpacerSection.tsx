import type { SectionProps } from '../types/storefront';

interface SpacerConfig {
    height?: string;
    show_divider?: boolean;
}

export function SpacerSection({ config }: SectionProps) {
    const { height, show_divider } = config as unknown as SpacerConfig;
    const spacerHeight = height || 'var(--section-spacing, 64px)';

    return (
        <div
            className="w-full"
            style={{ height: spacerHeight }}
        >
            {show_divider && (
                <div
                    className="mx-auto flex h-full items-center px-4 sm:px-6"
                    style={{ maxWidth: 'var(--container-width, 1280px)' }}
                >
                    <hr
                        className="w-full border-0"
                        style={{
                            height: '1px',
                            backgroundColor: 'var(--color-border, #e5e5e5)',
                        }}
                    />
                </div>
            )}
        </div>
    );
}
