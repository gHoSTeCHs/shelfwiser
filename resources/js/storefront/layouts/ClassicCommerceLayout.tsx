import { useState, useCallback } from 'react';
import { StandardHeader } from './components/headers/StandardHeader';
import { CenteredLogoHeader } from './components/headers/CenteredLogoHeader';
import { MultiColumnFooter } from './components/footers/MultiColumnFooter';
import { MinimalFooter } from './components/footers/MinimalFooter';
import { CenteredFooter } from './components/footers/CenteredFooter';
import { SearchBar } from '../components/SearchBar';
import { CartDrawer } from '../components/CartDrawer';
import type { LayoutProps, CartSummary, ResolvedTheme } from '../types/storefront';

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
    children,
}: LayoutProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState<CartSummary>(initialCart);

    const handleCartUpdate = useCallback((summary: CartSummary) => {
        setCart(summary);
    }, []);

    const headerProps = {
        shop,
        navigation,
        cart,
        customer,
        theme,
        onSearchOpen: () => setSearchOpen(true),
        onCartOpen: () => setCartOpen(true),
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

            <main className="flex-1">{children}</main>

            <Footer shop={shop} navigation={navigation} theme={theme} />

            <SearchBar
                shop={shop}
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />

            <CartDrawer
                shop={shop}
                cart={cart}
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                onCartUpdate={handleCartUpdate}
            />
        </div>
    );
}
