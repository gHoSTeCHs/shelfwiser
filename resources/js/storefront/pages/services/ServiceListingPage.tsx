import { useState } from 'react';
import { formatCurrency } from '../../lib/formatters';
import type { FixedPageProps, ServiceItemData, ServicesPageData } from '../../types/storefront';

export function ServiceListingPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as ServicesPageData;
    const services = pageData.services ?? [];
    const [filter, setFilter] = useState('');

    const categories = [...new Set(services.map((s) => s.category_name).filter(Boolean))] as string[];

    const filtered = filter
        ? services.filter((s) => s.category_name === filter)
        : services;

    return (
        <div style={{ maxWidth: 'var(--container-width, 1280px)', margin: '0 auto', padding: 'var(--section-spacing, 64px) 24px', fontFamily: 'var(--font-body)' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))', margin: '0 0 24px' }}>
                Our Services
            </h1>

            {categories.length > 1 && (
                <div className="flex flex-wrap gap-2" style={{ marginBottom: '24px' }}>
                    <FilterChip label="All" active={filter === ''} onClick={() => setFilter('')} />
                    {categories.map((cat) => (
                        <FilterChip key={cat} label={cat} active={filter === cat} onClick={() => setFilter(cat)} />
                    ))}
                </div>
            )}

            {filtered.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 'var(--radius, 6px)', backgroundColor: 'var(--color-surface, #fff)' }}>
                    <p style={{ color: 'var(--color-muted-foreground, #6b7280)', fontSize: '15px', margin: 0 }}>
                        No services available at the moment.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((service) => (
                        <ServiceCard key={service.id} service={service} shop={shop} />
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 500,
                border: `1px solid ${active ? 'var(--color-primary, #111)' : 'var(--color-border, #e5e7eb)'}`,
                backgroundColor: active ? 'var(--color-primary, #111)' : 'var(--color-surface, #fff)',
                color: active ? 'var(--color-primary-foreground, #fff)' : 'var(--color-foreground, #111)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
            }}
        >
            {label}
        </button>
    );
}

function ServiceCard({ service, shop }: { service: ServiceItemData; shop: FixedPageProps['shop'] }) {
    const firstVariant = service.variants.find((v) => v.is_active) ?? service.variants[0];
    const price = firstVariant?.price ?? 0;
    const duration = firstVariant?.duration_minutes ?? 0;

    return (
        <a
            href={`/store/${shop.slug}/services/${service.slug}`}
            style={{
                display: 'block',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: 'var(--radius, 6px)',
                backgroundColor: 'var(--color-surface, #fff)',
                overflow: 'hidden',
                textDecoration: 'none',
                transition: 'box-shadow 0.2s',
            }}
        >
            <div style={{ padding: '24px' }}>
                {service.category_name && (
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 500, color: 'var(--color-primary, #111)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {service.category_name}
                    </p>
                )}
                <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 600, color: 'var(--color-foreground, #111)', fontFamily: 'var(--font-heading, var(--font-body))' }}>
                    {service.name}
                </h3>
                {service.description && (
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-muted-foreground, #6b7280)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {service.description}
                    </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-foreground, #111)' }}>
                        {price > 0 ? formatCurrency(price, shop.currency_symbol, shop.currency_decimals) : 'Free'}
                    </span>
                    {duration > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'var(--color-muted, #f3f4f6)' }}>
                            {duration} min
                        </span>
                    )}
                </div>
                {service.variants.length > 1 && (
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-muted-foreground, #6b7280)' }}>
                        {service.variants.length} options available
                    </p>
                )}
            </div>
        </a>
    );
}
