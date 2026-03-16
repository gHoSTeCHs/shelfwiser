import type { ShopData } from '../types/storefront';

interface AuthGatePromptProps {
    shop: ShopData;
}

export function AuthGatePrompt({ shop }: AuthGatePromptProps) {
    const currentPath = typeof window !== 'undefined'
        ? encodeURIComponent(window.location.pathname + window.location.search)
        : '';

    return (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-foreground, #111)', margin: '0 0 12px' }}>
                    Please sign in
                </h2>
                <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '14px', margin: '0 0 20px' }}>
                    You need to be signed in to access this page.
                </p>
                <a
                    href={`/store/${shop.slug}/login${currentPath ? `?redirect=${currentPath}` : ''}`}
                    style={{
                        display: 'inline-block',
                        padding: '10px 24px',
                        backgroundColor: 'var(--color-primary, #111)',
                        color: 'var(--color-primary-foreground, #fff)',
                        borderRadius: 'var(--radius, 6px)',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}
                >
                    Sign In
                </a>
            </div>
        </div>
    );
}
