import { useState, useEffect } from 'react';
import type { ShopData, NavigationData, CartSummary, CustomerData, ResolvedTheme } from '../../../types/storefront';

interface StandardHeaderProps {
    shop: ShopData;
    navigation: NavigationData;
    cart: CartSummary;
    customer: CustomerData | null;
    theme: ResolvedTheme;
    isDark?: boolean;
    onToggleDark?: () => void;
    onSearchOpen: () => void;
    onCartOpen: () => void;
}

function NavLink({ href, label, shopSlug }: { href: string; label: string; shopSlug: string }) {
    const [hovered, setHovered] = useState(false);
    const isActive = typeof window !== 'undefined' && window.location.pathname === href;

    return (
        <a
            href={href}
            className="relative py-1 text-[13px] font-medium uppercase tracking-[0.06em]"
            style={{
                color: hovered || isActive ? 'var(--color-primary, #e94560)' : 'var(--color-text, #1a1a1a)',
                fontFamily: 'var(--font-body, sans-serif)',
                transition: 'color 0.25s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {label}
            <span
                style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: 'var(--color-primary, #e94560)',
                    borderRadius: 1,
                    transform: hovered || isActive ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left center',
                    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            />
        </a>
    );
}

function ActionButton({
    onClick,
    href,
    label,
    children,
}: {
    onClick?: () => void;
    href?: string;
    label: string;
    children: React.ReactNode;
}) {
    const [hovered, setHovered] = useState(false);
    const style: React.CSSProperties = {
        color: 'var(--color-text, #1a1a1a)',
        backgroundColor: hovered ? 'var(--color-border, rgba(0,0,0,0.05))' : 'transparent',
        borderRadius: '50%',
        transition: 'background-color 0.2s ease, color 0.2s ease',
    };
    const className = 'flex h-10 w-10 items-center justify-center';
    const props = {
        style,
        className,
        'aria-label': label,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
    };

    if (href) {
        return <a href={href} {...props}>{children}</a>;
    }
    return <button onClick={onClick} {...props}>{children}</button>;
}

export function StandardHeader({
    shop,
    navigation,
    cart,
    customer,
    theme,
    isDark,
    onToggleDark,
    onSearchOpen,
    onCartOpen,
}: StandardHeaderProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [prevCount, setPrevCount] = useState(cart.item_count);
    const [badgeBounce, setBadgeBounce] = useState(false);
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

    useEffect(() => {
        if (cart.item_count > prevCount) {
            setBadgeBounce(true);
            const t = setTimeout(() => setBadgeBounce(false), 500);
            return () => clearTimeout(t);
        }
        setPrevCount(cart.item_count);
    }, [cart.item_count, prevCount]);

    const stickyClass = isSticky ? 'sticky top-0 z-50' : 'relative z-50';

    return (
        <header
            className={stickyClass}
            style={{
                backgroundColor: scrolled
                    ? 'color-mix(in srgb, var(--color-background, #fff) 85%, transparent)'
                    : 'var(--color-background, #fff)',
                backdropFilter: scrolled ? 'blur(20px) saturate(1.2)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.2)' : 'none',
                borderBottom: scrolled
                    ? '1px solid color-mix(in srgb, var(--color-border, #e5e5e5) 60%, transparent)'
                    : '1px solid var(--color-border, #e5e5e5)',
                fontFamily: 'var(--font-body, sans-serif)',
                boxShadow: scrolled
                    ? '0 4px 30px -4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
                    : 'none',
                transition: 'background-color 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
            }}
        >
            <div
                className="mx-auto flex h-[68px] items-center justify-between gap-6 px-5 sm:px-8"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {/* Logo */}
                <a
                    href={`/store/${shop.slug}`}
                    className="group shrink-0"
                    style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
                >
                    {shop.logo ? (
                        <img
                            src={shop.logo}
                            alt={shop.name}
                            className="h-8 w-auto"
                            style={{
                                transition: 'opacity 0.2s ease',
                            }}
                        />
                    ) : (
                        <span
                            className="text-xl"
                            style={{
                                color: 'var(--color-text, #1a1a1a)',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            {shop.name}
                        </span>
                    )}
                </a>

                {/* Desktop navigation */}
                <nav className="hidden items-center gap-7 lg:flex">
                    {navigation.items.map((item) => (
                        <NavLink
                            key={item.slug}
                            href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                            label={item.label}
                            shopSlug={shop.slug}
                        />
                    ))}
                </nav>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5">
                    {onToggleDark && (
                        <ActionButton onClick={onToggleDark} label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                            {isDark ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <circle cx="12" cy="12" r="5" />
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                        </ActionButton>
                    )}

                    <ActionButton onClick={onSearchOpen} label="Search">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </ActionButton>

                    <div className="hidden sm:block">
                        <ActionButton
                            href={customer ? `/store/${shop.slug}/account-dashboard` : `/store/${shop.slug}/login`}
                            label={customer ? 'Account' : 'Sign in'}
                        >
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </ActionButton>
                    </div>

                    <button
                        onClick={onCartOpen}
                        className="relative flex h-10 w-10 items-center justify-center"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                        aria-label="Cart"
                    >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        {cart.item_count > 0 && (
                            <span
                                className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-[10px] font-bold text-white"
                                style={{
                                    backgroundColor: 'var(--color-primary, #e94560)',
                                    borderRadius: 10,
                                    minWidth: 20,
                                    height: 20,
                                    padding: '0 5px',
                                    boxShadow: '0 2px 8px -2px var(--color-primary, rgba(233,69,96,0.5))',
                                    transform: badgeBounce ? 'scale(1.25)' : 'scale(1)',
                                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                            <line x1="4" y1="7" x2="20" y2="7" />
                            <line x1="4" y1="12" x2="16" y2="12" />
                            <line x1="4" y1="17" x2="20" y2="17" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile overlay */}
            <div
                className="fixed inset-0 z-[100] lg:hidden"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    backdropFilter: mobileOpen ? 'blur(4px)' : 'none',
                    WebkitBackdropFilter: mobileOpen ? 'blur(4px)' : 'none',
                    opacity: mobileOpen ? 1 : 0,
                    pointerEvents: mobileOpen ? 'auto' : 'none',
                    transition: 'opacity 0.35s ease',
                }}
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile drawer */}
            <div
                className="fixed top-0 left-0 bottom-0 z-[110] w-[280px] lg:hidden"
                style={{
                    backgroundColor: 'var(--color-background, #fff)',
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: mobileOpen ? '8px 0 40px -8px rgba(0,0,0,0.15)' : 'none',
                }}
            >
                {/* Drawer header */}
                <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{
                        borderBottom: '1px solid var(--color-border, #e5e5e5)',
                    }}
                >
                    <a href={`/store/${shop.slug}`} style={{ fontFamily: 'var(--font-heading, sans-serif)' }}>
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="h-7 w-auto" />
                        ) : (
                            <span
                                className="text-base"
                                style={{
                                    color: 'var(--color-text, #1a1a1a)',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {shop.name}
                            </span>
                        )}
                    </a>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="flex h-9 w-9 items-center justify-center"
                        style={{
                            color: 'var(--color-text-muted, #888)',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-border, rgba(0,0,0,0.04))',
                            transition: 'background-color 0.2s ease',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Drawer nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-3">
                    {navigation.items.map((item, i) => {
                        const isActive = typeof window !== 'undefined'
                            && window.location.pathname === `/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`;
                        return (
                            <a
                                key={item.slug}
                                href={`/store/${shop.slug}/${item.page_type === 'home' ? '' : item.slug}`}
                                className="flex items-center gap-3 px-3 py-3.5 text-[15px] font-medium"
                                style={{
                                    color: isActive ? 'var(--color-primary, #e94560)' : 'var(--color-text, #1a1a1a)',
                                    borderRadius: 'calc(var(--radius, 8px) * 0.75)',
                                    backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary, #e94560) 8%, transparent)' : 'transparent',
                                    transition: 'background-color 0.2s ease',
                                    opacity: mobileOpen ? 1 : 0,
                                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-12px)',
                                    transitionDelay: mobileOpen ? `${80 + i * 40}ms` : '0ms',
                                    transitionProperty: 'opacity, transform, background-color',
                                    transitionDuration: '0.35s',
                                }}
                            >
                                {isActive && (
                                    <span
                                        style={{
                                            width: 3,
                                            height: 20,
                                            borderRadius: 2,
                                            backgroundColor: 'var(--color-primary, #e94560)',
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                {item.label}
                            </a>
                        );
                    })}
                </nav>

                {/* Drawer footer */}
                <div
                    className="px-6 py-5"
                    style={{ borderTop: '1px solid var(--color-border, #e5e5e5)' }}
                >
                    <a
                        href={customer ? `/store/${shop.slug}/account-dashboard` : `/store/${shop.slug}/login`}
                        className="flex items-center gap-3 text-sm font-medium"
                        style={{ color: 'var(--color-text, #1a1a1a)' }}
                    >
                        <span
                            className="flex h-9 w-9 items-center justify-center"
                            style={{
                                borderRadius: '50%',
                                backgroundColor: 'color-mix(in srgb, var(--color-primary, #e94560) 10%, transparent)',
                                color: 'var(--color-primary, #e94560)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        {customer ? customer.name : 'Sign In'}
                    </a>
                </div>
            </div>
        </header>
    );
}
