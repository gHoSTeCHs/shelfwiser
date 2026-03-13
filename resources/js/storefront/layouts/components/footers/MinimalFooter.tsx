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
            style={{
                backgroundColor: 'var(--color-footer-bg, var(--color-foreground, #1a1a1a))',
                color: 'var(--color-footer-text, var(--color-background, #fff))',
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            <div
                className="mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <p className="text-xs" style={{ opacity: 0.5 }}>
                    &copy; {year} {shop.name}
                </p>
                {navigation.social_links && (
                    <SocialLinks links={navigation.social_links} />
                )}
            </div>
        </footer>
    );
}
