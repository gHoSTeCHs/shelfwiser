import { useState } from 'react';
import type { ShopData, NavigationData, ResolvedTheme } from '../../../types/storefront';
import { SocialLinks } from './SocialLinks';

interface MultiColumnFooterProps {
    shop: ShopData;
    navigation: NavigationData;
    theme: ResolvedTheme;
}

function FooterLink({ href, label }: { href: string; label: string }) {
    const [hovered, setHovered] = useState(false);
    return (
        <a
            href={href}
            className="flex items-center gap-2 text-sm"
            style={{
                color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'color 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span
                style={{
                    width: 5,
                    height: 1,
                    backgroundColor: 'var(--color-primary, #e94560)',
                    borderRadius: 1,
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                    flexShrink: 0,
                }}
            />
            {label}
        </a>
    );
}

export function MultiColumnFooter({ shop, navigation }: MultiColumnFooterProps) {
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
                        radial-gradient(ellipse 70% 50% at 0% 100%, color-mix(in srgb, var(--color-primary, #e94560) 15%, #111) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 40% at 100% 0%, color-mix(in srgb, var(--color-secondary, #064E3B) 12%, #111) 0%, transparent 50%),
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

            {/* Top gradient accent line */}
            <div
                style={{
                    height: 1,
                    background: `linear-gradient(to right, transparent, var(--color-primary, #e94560), color-mix(in srgb, var(--color-primary, #e94560) 40%, var(--color-secondary, #047857)), transparent)`,
                    opacity: 0.5,
                }}
            />

            {/* Content */}
            <div
                className="relative mx-auto grid grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-20"
                style={{
                    maxWidth: 'var(--container-width, 1280px)',
                    color: 'var(--color-footer-text, var(--color-background, #fff))',
                }}
            >
                {/* Brand column */}
                <div className="lg:pr-6">
                    <a
                        href={`/store/${shop.slug}`}
                        style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
                    >
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="h-8 w-auto brightness-0 invert" />
                        ) : (
                            <span
                                className="text-xl"
                                style={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                            >
                                {shop.name}
                            </span>
                        )}
                    </a>
                    <p
                        className="mt-4 text-sm leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 240 }}
                    >
                        Quality products, great prices. Proudly serving our customers with care.
                    </p>

                    {navigation.social_links && (
                        <div className="mt-6">
                            <SocialLinks links={navigation.social_links} size="sm" />
                        </div>
                    )}
                </div>

                {/* Pages column */}
                <div>
                    <h4
                        className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase"
                        style={{
                            letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.35)',
                        }}
                    >
                        <span
                            style={{
                                width: 12,
                                height: 1,
                                backgroundColor: 'var(--color-primary, #e94560)',
                                borderRadius: 1,
                            }}
                        />
                        Pages
                    </h4>
                    <nav className="space-y-3">
                        {navigation.items.map((item) => (
                            <FooterLink
                                key={item.slug}
                                href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                                label={item.label}
                            />
                        ))}
                    </nav>
                </div>

                {/* Customer column */}
                <div>
                    <h4
                        className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase"
                        style={{
                            letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.35)',
                        }}
                    >
                        <span
                            style={{
                                width: 12,
                                height: 1,
                                backgroundColor: 'var(--color-primary, #e94560)',
                                borderRadius: 1,
                            }}
                        />
                        Customer
                    </h4>
                    <nav className="space-y-3">
                        <FooterLink href={`/store/${shop.slug}/login`} label="Sign In" />
                        <FooterLink href={`/store/${shop.slug}/register`} label="Create Account" />
                        <FooterLink href={`/store/${shop.slug}/cart`} label="Cart" />
                    </nav>
                </div>

                {/* Contact / info column */}
                <div>
                    <h4
                        className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase"
                        style={{
                            letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.35)',
                        }}
                    >
                        <span
                            style={{
                                width: 12,
                                height: 1,
                                backgroundColor: 'var(--color-primary, #e94560)',
                                borderRadius: 1,
                            }}
                        />
                        About
                    </h4>
                    <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                        Your trusted store for quality products at competitive prices.
                    </p>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="relative">
                <div
                    className="mx-auto"
                    style={{
                        maxWidth: 'var(--container-width, 1280px)',
                        padding: '0 1.25rem',
                    }}
                >
                    <div
                        style={{
                            height: 1,
                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)',
                        }}
                    />
                </div>

                <div
                    className="mx-auto flex flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row sm:px-8"
                    style={{
                        maxWidth: 'var(--container-width, 1280px)',
                        color: 'var(--color-footer-text, var(--color-background, #fff))',
                    }}
                >
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        &copy; {year} {shop.name}. All rights reserved.
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        Powered by ShelfWise
                    </p>
                </div>
            </div>
        </footer>
    );
}
