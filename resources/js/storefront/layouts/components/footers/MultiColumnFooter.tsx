import type { ShopData, NavigationData, ResolvedTheme } from '../../../types/storefront';
import { SocialLinks } from './SocialLinks';

interface MultiColumnFooterProps {
    shop: ShopData;
    navigation: NavigationData;
    theme: ResolvedTheme;
}

export function MultiColumnFooter({ shop, navigation, theme }: MultiColumnFooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer
            style={{
                backgroundColor: 'var(--color-footer-bg, var(--color-foreground, #1a1a1a))',
                color: 'var(--color-footer-text, var(--color-background, #fff))',
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            <div
                className="mx-auto grid grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-16"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <div>
                    <a href={`/store/${shop.slug}`} style={{ fontFamily: 'var(--font-heading, sans-serif)' }}>
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="h-8 w-auto brightness-0 invert" />
                        ) : (
                            <span className="text-lg font-bold">{shop.name}</span>
                        )}
                    </a>
                    <p className="mt-4 text-sm leading-relaxed" style={{ opacity: 0.7 }}>
                        Quality products, great prices.
                    </p>
                </div>

                <div>
                    <h4
                        className="mb-4 text-xs font-semibold uppercase tracking-wider"
                        style={{ opacity: 0.5 }}
                    >
                        Pages
                    </h4>
                    <nav className="space-y-2.5">
                        {navigation.items.map((item) => (
                            <a
                                key={item.slug}
                                href={`/store/${shop.slug}/${item.page_type === 'HOME' ? '' : item.slug}`}
                                className="block text-sm transition-opacity hover:opacity-100"
                                style={{ opacity: 0.7 }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>

                <div>
                    <h4
                        className="mb-4 text-xs font-semibold uppercase tracking-wider"
                        style={{ opacity: 0.5 }}
                    >
                        Customer
                    </h4>
                    <nav className="space-y-2.5">
                        <a href={`/store/${shop.slug}/login`} className="block text-sm transition-opacity hover:opacity-100" style={{ opacity: 0.7 }}>
                            Sign In
                        </a>
                        <a href={`/store/${shop.slug}/register`} className="block text-sm transition-opacity hover:opacity-100" style={{ opacity: 0.7 }}>
                            Create Account
                        </a>
                        <a href={`/store/${shop.slug}/cart`} className="block text-sm transition-opacity hover:opacity-100" style={{ opacity: 0.7 }}>
                            Cart
                        </a>
                    </nav>
                </div>

                <div>
                    <h4
                        className="mb-4 text-xs font-semibold uppercase tracking-wider"
                        style={{ opacity: 0.5 }}
                    >
                        Connect
                    </h4>
                    {navigation.social_links && (
                        <SocialLinks links={navigation.social_links} />
                    )}
                </div>
            </div>

            <div
                className="mx-auto px-4 py-5 sm:px-6"
                style={{
                    maxWidth: 'var(--container-width, 1280px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <p className="text-center text-xs" style={{ opacity: 0.4 }}>
                    &copy; {year} {shop.name}. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
