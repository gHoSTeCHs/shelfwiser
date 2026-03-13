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
            style={{
                backgroundColor: 'var(--color-footer-bg, var(--color-foreground, #1a1a1a))',
                color: 'var(--color-footer-text, var(--color-background, #fff))',
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            <div
                className="mx-auto flex flex-col items-center px-4 py-12 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <a href={`/store/${shop.slug}`} style={{ fontFamily: 'var(--font-heading, sans-serif)' }}>
                    {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="h-8 w-auto brightness-0 invert" />
                    ) : (
                        <span className="text-xl font-bold">{shop.name}</span>
                    )}
                </a>

                <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    {navigation.items.map((item) => (
                        <a
                            key={item.slug}
                            href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                            className="text-sm transition-opacity hover:opacity-100"
                            style={{ opacity: 0.7 }}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {navigation.social_links && (
                    <div className="mt-6">
                        <SocialLinks links={navigation.social_links} />
                    </div>
                )}

                <div
                    className="mt-8 w-full pt-6 text-center"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <p className="text-xs" style={{ opacity: 0.4 }}>
                        &copy; {year} {shop.name}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
