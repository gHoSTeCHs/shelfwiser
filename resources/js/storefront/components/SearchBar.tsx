import { useState, useRef, useEffect, useCallback } from 'react';
import { storefrontFetch } from '../lib/fetch-client';
import { formatCurrency } from '../lib/formatters';
import type { ShopData } from '../types/storefront';

interface SearchResult {
    id: number;
    name: string;
    slug: string;
    price: number;
    image: string | null;
}

interface SearchBarProps {
    shop: ShopData;
    isOpen: boolean;
    onClose: () => void;
}

export function SearchBar({ shop, isOpen, onClose }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const search = useCallback(
        (term: string) => {
            if (term.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            storefrontFetch<{ data: SearchResult[] }>(
                `/store/${shop.slug}/api/search?q=${encodeURIComponent(term)}`,
            )
                .then((res) => {
                    if (res.ok) setResults(res.data.data ?? []);
                })
                .finally(() => setIsLoading(false));
        },
        [shop.slug],
    );

    function handleChange(value: string) {
        setQuery(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 300);
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onClick={onClose}
                />
            )}

            <div
                style={{
                    transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
                    opacity: isOpen ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
                    backgroundColor: 'var(--color-background, #fff)',
                    borderBottom: '1px solid var(--color-border, #e5e5e5)',
                    fontFamily: 'var(--font-body, sans-serif)',
                }}
                className="fixed top-0 left-0 right-0 z-[70] px-4 py-6"
            >
                <div className="mx-auto" style={{ maxWidth: 'var(--container-width, 1280px)' }}>
                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-text-muted, #888)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="Search products..."
                            className="w-full py-3 pl-12 pr-12 text-base outline-none"
                            style={{
                                border: '2px solid var(--color-border, #e5e5e5)',
                                borderRadius: 'var(--radius, 8px)',
                                color: 'var(--color-text, #1a1a1a)',
                                backgroundColor: 'var(--color-surface, #fafafa)',
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            onClick={onClose}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                            style={{ color: 'var(--color-text-muted, #888)' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {isLoading && (
                        <div className="py-6 text-center text-sm" style={{ color: 'var(--color-text-muted, #888)' }}>
                            Searching...
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="mt-4 max-h-80 overflow-y-auto">
                            {results.map((item) => (
                                <a
                                    key={item.id}
                                    href={`/store/${shop.slug}/products/${item.slug}`}
                                    className="flex items-center gap-4 px-3 py-3 transition-colors"
                                    style={{ borderRadius: 'var(--radius, 8px)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface, #f5f5f5)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <div
                                        className="h-12 w-12 shrink-0 overflow-hidden"
                                        style={{
                                            borderRadius: 'calc(var(--radius, 8px) * 0.5)',
                                            backgroundColor: 'var(--color-surface, #f0f0f0)',
                                        }}
                                    >
                                        {item.image && (
                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium" style={{ color: 'var(--color-text, #1a1a1a)' }}>
                                            {item.name}
                                        </div>
                                        <div className="mt-0.5 text-sm" style={{ color: 'var(--color-primary, #e94560)' }}>
                                            {formatCurrency(item.price, shop.currency_symbol, shop.currency_decimals)}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    {!isLoading && query.length >= 2 && results.length === 0 && (
                        <div className="py-6 text-center text-sm" style={{ color: 'var(--color-text-muted, #888)' }}>
                            No products found for &ldquo;{query}&rdquo;
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
