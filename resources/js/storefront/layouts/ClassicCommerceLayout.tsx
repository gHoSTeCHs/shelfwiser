import React, { useState, useEffect, Children } from 'react';
import { StandardHeader } from './components/headers/StandardHeader';
import { CenteredLogoHeader } from './components/headers/CenteredLogoHeader';
import { MultiColumnFooter } from './components/footers/MultiColumnFooter';
import { MinimalFooter } from './components/footers/MinimalFooter';
import { CenteredFooter } from './components/footers/CenteredFooter';
import { SearchBar } from '../components/SearchBar';
import { CartDrawer } from '../components/CartDrawer';
import { useCartStore } from '../stores/cart-store';
import type { LayoutProps, ResolvedTheme } from '../types/storefront';

type FooterComponent = React.FC<{ shop: LayoutProps['shop']; navigation: LayoutProps['navigation']; theme: ResolvedTheme }>;

const footerRegistry: Record<string, FooterComponent> = {
    multi_column: MultiColumnFooter,
    minimal: MinimalFooter,
    centered: CenteredFooter,
};

export function ClassicCommerceLayout({
    shop,
    navigation,
    cart: initialCart,
    theme,
    customer,
    isDark,
    onToggleDark,
    children,
}: LayoutProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const cartStore = useCartStore();

    useEffect(() => {
        cartStore.initialize(shop.slug, initialCart);
    }, [shop.slug]);

    const headerProps = {
        shop,
        navigation,
        cart: cartStore.summary,
        customer,
        theme,
        isDark: isDark ?? false,
        onToggleDark,
        onSearchOpen: () => setSearchOpen(true),
        onCartOpen: () => cartStore.openDrawer(),
    };

    const Header = theme.header.variant === 'centered_logo' ? CenteredLogoHeader : StandardHeader;
    const Footer = footerRegistry[theme.footer.variant ?? 'multi_column'] ?? MultiColumnFooter;

    return (
        <div
            className="flex min-h-screen flex-col"
            style={{
                backgroundColor: 'var(--color-background, #fff)',
                color: 'var(--color-text, #1a1a1a)',
            }}
        >
            {navigation.announcement && navigation.announcement.is_active && navigation.announcement.text && (
                <div
                    className="py-2 text-center text-xs font-medium sm:text-sm"
                    style={{
                        backgroundColor: 'var(--color-primary, #1a1a1a)',
                        color: '#fff',
                        fontFamily: 'var(--font-body, sans-serif)',
                    }}
                >
                    {navigation.announcement.link ? (
                        <a href={navigation.announcement.link} className="underline-offset-2 hover:underline">
                            {navigation.announcement.text}
                        </a>
                    ) : (
                        navigation.announcement.text
                    )}
                </div>
            )}

            <Header {...headerProps} />

            <main className="flex-1">
                <SectionDividerWrapper dividerStyle={theme.feel.divider_style as string | undefined}>
                    {children}
                </SectionDividerWrapper>
            </main>

            <Footer shop={shop} navigation={navigation} theme={theme} />

            <SearchBar
                shop={shop}
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />

            <CartDrawer shop={shop} />
        </div>
    );
}

function SectionDividerWrapper({
    dividerStyle,
    children,
}: {
    dividerStyle?: string;
    children: React.ReactNode;
}) {
    if (!dividerStyle || dividerStyle === 'none') {
        return <>{children}</>;
    }

    const childArray = Children.toArray(children).filter(Boolean);

    const divider = dividerStyle === 'dots' ? (
        <div
            className="mx-auto px-5 sm:px-8"
            style={{ maxWidth: 'var(--container-width, 1280px)' }}
        >
            <div
                style={{
                    height: 2,
                    backgroundImage: 'radial-gradient(circle, var(--color-border, #d1d5db) 1px, transparent 1px)',
                    backgroundSize: '12px 2px',
                }}
            />
        </div>
    ) : (
        <div
            className="mx-auto px-5 sm:px-8"
            style={{ maxWidth: 'var(--container-width, 1280px)' }}
        >
            <div style={{ height: 1, backgroundColor: 'var(--color-border, #e5e7eb)' }} />
        </div>
    );

    return (
        <>
            {childArray.map((child, i) => (
                <React.Fragment key={i}>
                    {child}
                    {i < childArray.length - 1 && divider}
                </React.Fragment>
            ))}
        </>
    );
}
