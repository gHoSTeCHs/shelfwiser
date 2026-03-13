import { useState, useEffect } from 'react';
import type { ShopData, NavigationData, CartSummary, CustomerData, ResolvedTheme } from '../../../types/storefront';

interface StandardHeaderProps {
    shop: ShopData;
    navigation: NavigationData;
    cart: CartSummary;
    customer: CustomerData | null;
    theme: ResolvedTheme;
    onSearchOpen: () => void;
    onCartOpen: () => void;
}

export function StandardHeader({
    shop,
    navigation,
    cart,
    customer,
    theme,
    onSearchOpen,
    onCartOpen,
}: StandardHeaderProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const isSticky = theme.header.position === 'sticky';

    useEffect(() => {
        if (!isSticky) return;
        function onScroll() {
            setScrolled(window.scrollY > 10);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isSticky]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const stickyClass = isSticky ? 'sticky top-0 z-50' : 'relative z-50';

    return (
        <header
            className={`${stickyClass} transition-shadow duration-300`}
            style={{
                backgroundColor: 'var(--color-background, #fff)',
                borderBottom: '1px solid var(--color-border, #e5e5e5)',
                fontFamily: 'var(--font-body, sans-serif)',
                boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.06)' : 'none',
            }}
        >
            <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                <a
                    href={`/store/${shop.slug}`}
                    className="shrink-0"
                    style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
                >
                    {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="h-8 w-auto" />
                    ) : (
                        <span className="text-lg font-bold" style={{ color: 'var(--color-text, #1a1a1a)' }}>
                            {shop.name}
                        </span>
                    )}
                </a>

                <nav className="hidden items-center gap-8 lg:flex">
                    {navigation.items.map((item) => (
                        <a
                            key={item.slug}
                            href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                            className="text-sm font-medium transition-colors"
                            style={{ color: 'var(--color-text, #1a1a1a)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary, #e94560)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text, #1a1a1a)')}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onSearchOpen}
                        className="flex h-10 w-10 items-center justify-center transition-colors"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                        aria-label="Search"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>

                    <a
                        href={customer ? `/store/${shop.slug}/account-dashboard` : `/store/${shop.slug}/login`}
                        className="hidden h-10 w-10 items-center justify-center transition-colors sm:flex"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                        aria-label={customer ? 'Account' : 'Sign in'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </a>

                    <button
                        onClick={onCartOpen}
                        className="relative flex h-10 w-10 items-center justify-center transition-colors"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                        aria-label="Cart"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        {cart.item_count > 0 && (
                            <span
                                className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center text-[10px] font-bold text-white"
                                style={{
                                    backgroundColor: 'var(--color-primary, #e94560)',
                                    borderRadius: '50%',
                                }}
                            >
                                {cart.item_count > 99 ? '99+' : cart.item_count}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setMobileOpen(true)}
                        className="flex h-10 w-10 items-center justify-center lg:hidden"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                        aria-label="Menu"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile drawer */}
            <div
                className="fixed inset-0 z-[100] transition-opacity duration-300 lg:hidden"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    opacity: mobileOpen ? 1 : 0,
                    pointerEvents: mobileOpen ? 'auto' : 'none',
                }}
                onClick={() => setMobileOpen(false)}
            />
            <div
                className="fixed top-0 left-0 bottom-0 z-[110] w-72 flex-col lg:hidden"
                style={{
                    backgroundColor: 'var(--color-background, #fff)',
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    display: 'flex',
                }}
            >
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border, #e5e5e5)' }}>
                    <a href={`/store/${shop.slug}`} style={{ fontFamily: 'var(--font-heading, sans-serif)' }}>
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="h-7 w-auto" />
                        ) : (
                            <span className="text-base font-bold" style={{ color: 'var(--color-text, #1a1a1a)' }}>
                                {shop.name}
                            </span>
                        )}
                    </a>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="flex h-8 w-8 items-center justify-center"
                        style={{ color: 'var(--color-text-muted, #888)' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-5 py-4">
                    {navigation.items.map((item) => (
                        <a
                            key={item.slug}
                            href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                            className="block py-3 text-base font-medium"
                            style={{
                                color: 'var(--color-text, #1a1a1a)',
                                borderBottom: '1px solid var(--color-border, #f0f0f0)',
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
                <div className="px-5 py-4" style={{ borderTop: '1px solid var(--color-border, #e5e5e5)' }}>
                    <a
                        href={customer ? `/store/${shop.slug}/account-dashboard` : `/store/${shop.slug}/login`}
                        className="flex items-center gap-3 text-sm font-medium"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        {customer ? customer.name : 'Sign In'}
                    </a>
                </div>
            </div>
        </header>
    );
}
