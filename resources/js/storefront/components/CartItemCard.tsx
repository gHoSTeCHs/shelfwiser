import { QuantitySelector } from './QuantitySelector';
import { formatCurrency } from '../lib/formatters';
import type { CartItemData, ShopData } from '../types/storefront';

interface CartItemCardProps {
    item: CartItemData;
    shop: ShopData;
    onQuantityChange: (itemId: number, quantity: number) => void;
    onRemove: (itemId: number) => void;
    disabled?: boolean;
}

export function CartItemCard({ item, shop, onQuantityChange, onRemove, disabled = false }: CartItemCardProps) {
    return (
        <div
            style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                borderBottom: '1px solid var(--color-border, #e5e7eb)',
                fontFamily: 'var(--font-body)',
            }}
        >
            {item.image && (
                <img
                    src={item.image}
                    alt={item.name}
                    style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius, 6px)',
                        flexShrink: 0,
                    }}
                />
            )}
            {!item.image && (
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'var(--color-muted, #f3f4f6)',
                        borderRadius: 'var(--radius, 6px)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-muted-foreground, #9ca3af)',
                        fontSize: '12px',
                    }}
                >
                    No image
                </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                    style={{
                        margin: '0 0 4px 0',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--color-foreground, #111)',
                        fontFamily: 'var(--font-heading, var(--font-body))',
                    }}
                >
                    {item.name}
                </h3>
                {item.variant_name && (
                    <p
                        style={{
                            margin: '0 0 8px 0',
                            fontSize: '13px',
                            color: 'var(--color-muted-foreground, #6b7280)',
                        }}
                    >
                        {item.variant_name}
                    </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <QuantitySelector
                        value={item.quantity}
                        min={1}
                        max={item.max_quantity}
                        onChange={(qty) => onQuantityChange(item.id, qty)}
                        disabled={disabled}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                            style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'var(--color-foreground, #111)',
                            }}
                        >
                            {formatCurrency(item.price * item.quantity, shop.currency_symbol, shop.currency_decimals)}
                        </span>
                        <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            disabled={disabled}
                            aria-label={`Remove ${item.name} from cart`}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-destructive, #ef4444)',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                padding: '4px 8px',
                                opacity: disabled ? 0.5 : 1,
                            }}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
