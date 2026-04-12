import type { ReactNode } from 'react';
import { storefrontFetch } from '../../lib/fetch-client';
import type { ShopData } from '../../types/storefront';

interface AccountLayoutProps {
    shop: ShopData;
    activeItem: 'dashboard' | 'orders' | 'profile';
    children: ReactNode;
}

const NAV_ITEMS: { key: AccountLayoutProps['activeItem']; label: string; path: string }[] = [
    { key: 'dashboard', label: 'Dashboard', path: '' },
    { key: 'orders', label: 'Orders', path: '/orders' },
    { key: 'profile', label: 'Profile', path: '/profile' },
];

export function AccountLayout({ shop, activeItem, children }: AccountLayoutProps) {
    async function handleLogout() {
        try {
            await storefrontFetch(`/store/${shop.slug}/api/auth/logout`, { method: 'POST' });
        } finally {
            window.location.href = `/store/${shop.slug}`;
        }
    }

    return (
        <div style={{ maxWidth: 'var(--container-width, 1280px)', margin: '0 auto', padding: 'var(--section-spacing, 64px) 24px', fontFamily: 'var(--font-body)' }}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
                <nav className="flex gap-2 overflow-x-auto border-b pb-3 lg:flex-col lg:gap-1 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
                    {NAV_ITEMS.map((item) => (
                        <a
                            key={item.key}
                            href={`/store/${shop.slug}/account${item.path}`}
                            style={{
                                display: 'block',
                                padding: '10px 16px',
                                borderRadius: 'var(--radius, 6px)',
                                fontSize: '14px',
                                fontWeight: activeItem === item.key ? 600 : 400,
                                color: activeItem === item.key ? 'var(--color-primary-foreground, #fff)' : 'var(--color-foreground, #111)',
                                backgroundColor: activeItem === item.key ? 'var(--color-primary, #111)' : 'transparent',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                    <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                            display: 'block',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius, 6px)',
                            fontSize: '14px',
                            color: 'var(--color-destructive, #ef4444)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'var(--font-body)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Sign Out
                    </button>
                </nav>
                <main style={{ minWidth: 0 }}>{children}</main>
            </div>
        </div>
    );
}
