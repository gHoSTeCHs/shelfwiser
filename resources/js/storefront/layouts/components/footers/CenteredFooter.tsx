import { useState } from 'react';
import type { ShopData, NavigationData, ResolvedTheme } from '../../../types/storefront';
import { SocialLinks } from './SocialLinks';

interface CenteredFooterProps {
    shop: ShopData;
    navigation: NavigationData;
    theme: ResolvedTheme;
}

export function CenteredFooter({ shop, navigation }: CenteredFooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer
            className="relative overflow-hidden"
            style={{
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            {/* Background layers */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse 50% 60% at 50% 80%, color-mix(in srgb, var(--color-primary, #e94560) 10%, #111) 0%, transparent 60%),
                        radial-gradient(ellipse 40% 40% at 30% 20%, color-mix(in srgb, var(--color-secondary, #064E3B) 8%, #111) 0%, transparent 50%),
                        var(--color-footer-bg, var(--color-foreground, #111111))
                    `,
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                    backgroundSize: '128px 128px',
                }}
            />

            {/* Top accent line */}
            <div
                style={{
                    height: 1,
                    background: `linear-gradient(to right, transparent, var(--color-primary, #e94560), color-mix(in srgb, var(--color-primary, #e94560) 40%, var(--color-secondary, #047857)), transparent)`,
                    opacity: 0.5,
                }}
            />

            <div
                className="relative mx-auto flex flex-col items-center px-5 py-14 sm:px-8 sm:py-16"
                style={{
                    maxWidth: 'var(--container-width, 1280px)',
                    color: 'var(--color-footer-text, var(--color-background, #fff))',
                }}
            >
                {/* Logo with subtle glow */}
                <a
                    href={`/store/${shop.slug}`}
                    className="relative"
                    style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle, var(--color-primary, rgba(233,69,96,0.08)) 0%, transparent 70%)',
                            transform: 'scale(3)',
                            pointerEvents: 'none',
                        }}
                    />
                    {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="relative h-9 w-auto brightness-0 invert" />
                    ) : (
                        <span
                            className="relative text-2xl"
                            style={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                        >
                            {shop.name}
                        </span>
                    )}
                </a>

                {/* Navigation with dot separators */}
                <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
                    {navigation.items.map((item, idx) => (
                        <CenteredNavLink
                            key={item.slug}
                            href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                            label={item.label}
                            showDot={idx > 0}
                        />
                    ))}
                </nav>

                {/* Social links */}
                {navigation.social_links && (
                    <div className="mt-8">
                        <SocialLinks links={navigation.social_links} />
                    </div>
                )}

                {/* Gradient separator */}
                <div className="mt-10 w-full max-w-xs">
                    <div
                        style={{
                            height: 1,
                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
                        }}
                    />
                </div>

                {/* Copyright */}
                <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        &copy; {year} {shop.name}. All rights reserved.
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        Powered by ShelfWise
                    </p>
                </div>
            </div>
        </footer>
    );
}

function CenteredNavLink({ href, label, showDot }: { href: string; label: string; showDot: boolean }) {
    const [hovered, setHovered] = useState(false);
    return (
        <>
            {showDot && (
                <span
                    className="mx-1"
                    style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        display: 'inline-block',
                    }}
                />
            )}
            <a
                href={href}
                className="text-[13px] font-medium uppercase"
                style={{
                    color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.06em',
                    transition: 'color 0.25s ease',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {label}
            </a>
        </>
    );
}
