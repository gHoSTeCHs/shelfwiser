import type { ShopData, NavigationData, ResolvedTheme } from '../../../types/storefront';
import { SocialLinks } from './SocialLinks';

interface MinimalFooterProps {
    shop: ShopData;
    navigation: NavigationData;
    theme: ResolvedTheme;
}

export function MinimalFooter({ shop, navigation }: MinimalFooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer
            className="relative overflow-hidden"
            style={{
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            {/* Background */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse 60% 80% at 50% 100%, color-mix(in srgb, var(--color-primary, #e94560) 8%, #111) 0%, transparent 60%),
                        var(--color-footer-bg, var(--color-foreground, #111111))
                    `,
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                    backgroundSize: '128px 128px',
                }}
            />

            {/* Top accent */}
            <div
                style={{
                    height: 1,
                    background: `linear-gradient(to right, transparent, var(--color-primary, #e94560), transparent)`,
                    opacity: 0.4,
                }}
            />

            <div
                className="relative mx-auto flex flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8"
                style={{
                    maxWidth: 'var(--container-width, 1280px)',
                    color: 'var(--color-footer-text, var(--color-background, #fff))',
                }}
            >
                <div className="flex items-center gap-3">
                    <span
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary, #e94560)',
                            opacity: 0.6,
                        }}
                    />
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        &copy; {year} {shop.name}
                    </p>
                </div>

                {navigation.social_links && (
                    <SocialLinks links={navigation.social_links} size="sm" />
                )}
            </div>
        </footer>
    );
}
