import { useState } from 'react';
import { formatCurrency } from '../../lib/formatters';
import { useCartStore } from '../../stores/cart-store';
import type {
    FixedPageProps,
    ProductDetailPageData,
    ProductVariantDetailData,
    StorefrontOptionData,
} from '../../types/storefront';

export function ProductDetailPage({ data, shop }: FixedPageProps) {
    const pageData = data as unknown as ProductDetailPageData;
    const product = pageData.product;

    const activeVariants = product?.variants.filter((v) => v.is_active) ?? [];
    const hasOptionAxes = !!(
        product?.has_variants &&
        product.options &&
        product.options.length > 0
    );

    const initOptionSelections = (): Record<number, number> => {
        if (!hasOptionAxes || !product?.options) return {};
        const first = activeVariants[0];
        if (!first?.option_value_ids?.length) return {};
        const result: Record<number, number> = {};
        product.options.forEach((opt) => {
            const match = opt.values.find((v) =>
                first.option_value_ids.includes(v.id),
            );
            if (match) result[opt.id] = match.id;
        });
        return result;
    };

    const [selectedOptionValues, setSelectedOptionValues] = useState<
        Record<number, number>
    >(initOptionSelections);
    const [selectedVariantId, setSelectedVariantId] = useState<number>(
        activeVariants[0]?.id ?? 0,
    );
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [btnHovered, setBtnHovered] = useState(false);

    if (!product) {
        return (
            <div
                className="mx-auto px-5 sm:px-8"
                style={{
                    maxWidth: 'var(--container-width, 1280px)',
                    padding: '96px 24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body, sans-serif)',
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: 'var(--color-foreground, #1a1a1a)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                    }}
                >
                    Product not found
                </h2>
                <a
                    href={`/store/${shop.slug}/products`}
                    style={{
                        display: 'inline-block',
                        marginTop: 18,
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-primary, #e94560)',
                        textDecoration: 'none',
                    }}
                >
                    &larr; Browse all products
                </a>
            </div>
        );
    }

    const optionMatchedVariant = hasOptionAxes
        ? (activeVariants.find((v) => {
              const selectedIds = Object.values(selectedOptionValues);
              return (
                  selectedIds.length > 0 &&
                  selectedIds.every((id) =>
                      v.option_value_ids.includes(id),
                  )
              );
          }) ?? null)
        : null;

    const selectedVariant =
        optionMatchedVariant ??
        activeVariants.find((v) => v.id === selectedVariantId) ??
        activeVariants[0];
    const basePrice = selectedVariant?.price ?? 0;
    const compareAtPrice = selectedVariant?.compare_at_price ?? null;
    const hasDiscount = compareAtPrice !== null && compareAtPrice > basePrice;
    const totalPrice = basePrice * quantity;
    const stockQty = selectedVariant?.stock_quantity ?? null;
    const inStock = stockQty === null || stockQty > 0;
    const fmt = (amount: number) => formatCurrency(amount, shop.currency_symbol, shop.currency_decimals);

    const images = product.images.filter((img) => img.url);
    const activeImage = images[activeImageIndex] ?? images[0] ?? null;

    const cartStore = useCartStore();

    async function handleAddToCart() {
        if (!selectedVariant) return;
        setAdding(true);
        setError('');
        setMessage('');

        const result = await cartStore.addItem(selectedVariant.id, quantity);

        if (result.ok) {
            setMessage(result.message ?? 'Added to cart!');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setError(result.message ?? 'Failed to add to cart.');
        }
        setAdding(false);
    }

    return (
        <div
            className="mx-auto px-5 sm:px-8"
            style={{
                maxWidth: 'var(--container-width, 1280px)',
                padding: 'var(--section-spacing, 64px) 0',
                fontFamily: 'var(--font-body, sans-serif)',
            }}
        >
            <a
                href={`/store/${shop.slug}/products`}
                className="inline-block"
                style={{
                    marginBottom: 24,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-muted-foreground, #6b7280)',
                    textDecoration: 'none',
                    letterSpacing: '0.01em',
                }}
            >
                &larr; Back to products
            </a>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
                {/* Image gallery */}
                <div>
                    <div
                        className="relative overflow-hidden"
                        style={{
                            borderRadius: 'calc(var(--radius, 8px) * 1.5)',
                            backgroundColor: 'var(--color-surface, #f5f5f5)',
                            aspectRatio: '1/1',
                        }}
                    >
                        {activeImage ? (
                            <img
                                src={activeImage.url ?? ''}
                                alt={activeImage.alt ?? product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <span
                                    style={{
                                        fontSize: 140,
                                        fontWeight: 800,
                                        color: 'var(--color-primary, #e94560)',
                                        opacity: 0.1,
                                        fontFamily: 'var(--font-heading, sans-serif)',
                                        letterSpacing: '-0.04em',
                                        lineHeight: 1,
                                    }}
                                >
                                    {product.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                        {product.is_new && (
                            <span
                                className="absolute"
                                style={{
                                    top: 16,
                                    left: 16,
                                    padding: '6px 14px',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    borderRadius: 'var(--radius, 8px)',
                                    backgroundColor: 'var(--color-primary, #e94560)',
                                    color: '#fff',
                                }}
                            >
                                New
                            </span>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="mt-4 grid grid-cols-5 gap-3">
                            {images.map((image, index) => (
                                <button
                                    key={image.id}
                                    type="button"
                                    onClick={() => setActiveImageIndex(index)}
                                    style={{
                                        aspectRatio: '1/1',
                                        overflow: 'hidden',
                                        borderRadius: 'var(--radius, 8px)',
                                        border: index === activeImageIndex
                                            ? '2px solid var(--color-primary, #e94560)'
                                            : '2px solid transparent',
                                        backgroundColor: 'var(--color-surface, #f5f5f5)',
                                        padding: 0,
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease',
                                    }}
                                    aria-label={`View image ${index + 1}`}
                                >
                                    <img
                                        src={image.url ?? ''}
                                        alt={image.alt ?? ''}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details + buy box */}
                <div className="flex flex-col">
                    {product.category_name && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--color-primary, #e94560)',
                            }}
                        >
                            {product.category_name}
                        </p>
                    )}

                    <h1
                        style={{
                            margin: '10px 0 0',
                            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                            color: 'var(--color-foreground, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                        }}
                    >
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div
                        className="flex items-baseline gap-3"
                        style={{ marginTop: 18 }}
                    >
                        <span
                            style={{
                                fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: hasDiscount
                                    ? 'var(--color-accent, #f59e0b)'
                                    : 'var(--color-foreground, #1a1a1a)',
                            }}
                        >
                            {fmt(basePrice)}
                        </span>
                        {hasDiscount && compareAtPrice !== null && (
                            <span
                                style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: 'var(--color-muted-foreground, #6b7280)',
                                    textDecoration: 'line-through',
                                }}
                            >
                                {fmt(compareAtPrice)}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div
                            style={{
                                marginTop: 24,
                                fontSize: 15,
                                lineHeight: 1.75,
                                color: 'var(--color-text, #4b5563)',
                                maxWidth: '60ch',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {product.description}
                        </div>
                    )}

                    {/* Variant / Option selector */}
                    {hasOptionAxes && product?.options ? (
                        <OptionAxisSelector
                            options={product.options}
                            activeVariants={activeVariants}
                            selectedOptionValues={selectedOptionValues}
                            onSelect={(optionId, valueId) =>
                                setSelectedOptionValues((prev) => ({
                                    ...prev,
                                    [optionId]: valueId,
                                }))
                            }
                        />
                    ) : (
                        activeVariants.length > 1 && (
                            <div style={{ marginTop: 28 }}>
                                <p
                                    style={{
                                        margin: '0 0 10px',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        color: 'var(--color-muted-foreground, #6b7280)',
                                    }}
                                >
                                    Options
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeVariants.map((variant) => (
                                        <VariantChip
                                            key={variant.id}
                                            variant={variant}
                                            selected={
                                                selectedVariantId === variant.id
                                            }
                                            onSelect={() =>
                                                setSelectedVariantId(variant.id)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {/* Quantity + add to cart */}
                    <div style={{ marginTop: 32 }}>
                        <p
                            style={{
                                margin: '0 0 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: 'var(--color-muted-foreground, #6b7280)',
                            }}
                        >
                            Quantity
                        </p>
                        <div className="flex items-center gap-4">
                            <QuantityStepper
                                quantity={quantity}
                                onChange={setQuantity}
                                max={stockQty ?? undefined}
                            />
                            {stockQty !== null && stockQty > 0 && stockQty <= 10 && (
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--color-accent, #f59e0b)',
                                    }}
                                >
                                    Only {stockQty} left
                                </span>
                            )}
                            {!inStock && (
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--color-error, #dc2626)',
                                    }}
                                >
                                    Out of stock
                                </span>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div
                            style={{
                                marginTop: 20,
                                padding: '12px 16px',
                                backgroundColor: 'color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)',
                                color: 'var(--color-success, #16a34a)',
                                borderRadius: 'var(--radius, 8px)',
                                border: '1px solid color-mix(in srgb, var(--color-success, #22c55e) 30%, transparent)',
                                fontSize: 14,
                                fontWeight: 600,
                                textAlign: 'center',
                            }}
                        >
                            {message}
                        </div>
                    )}
                    {error && (
                        <div
                            style={{
                                marginTop: 20,
                                padding: '12px 16px',
                                backgroundColor: 'color-mix(in srgb, var(--color-error, #dc2626) 8%, transparent)',
                                color: 'var(--color-error, #dc2626)',
                                borderRadius: 'var(--radius, 8px)',
                                border: '1px solid color-mix(in srgb, var(--color-error, #dc2626) 25%, transparent)',
                                fontSize: 14,
                                fontWeight: 500,
                                textAlign: 'center',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={adding || !selectedVariant || !inStock}
                        style={{
                            marginTop: 24,
                            width: '100%',
                            padding: '18px 24px',
                            border: 'none',
                            borderRadius: 'var(--radius, 8px)',
                            backgroundColor: !inStock || !selectedVariant
                                ? 'var(--color-muted, #9ca3af)'
                                : btnHovered && !adding
                                  ? 'var(--color-foreground, #111)'
                                  : 'var(--color-primary, #e94560)',
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            cursor: adding || !selectedVariant || !inStock ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body, sans-serif)',
                            opacity: adding ? 0.7 : 1,
                            transition: 'background-color 0.2s ease, opacity 0.2s ease',
                        }}
                        onMouseEnter={() => setBtnHovered(true)}
                        onMouseLeave={() => setBtnHovered(false)}
                    >
                        {adding
                            ? 'Adding...'
                            : !inStock
                              ? 'Out of stock'
                              : `Add to Cart — ${fmt(totalPrice)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OptionAxisSelector({
    options,
    activeVariants,
    selectedOptionValues,
    onSelect,
}: {
    options: StorefrontOptionData[];
    activeVariants: ProductVariantDetailData[];
    selectedOptionValues: Record<number, number>;
    onSelect: (optionId: number, valueId: number) => void;
}) {
    const isValueAvailable = (optionId: number, valueId: number): boolean => {
        const hypothetical = { ...selectedOptionValues, [optionId]: valueId };
        const selectedIds = Object.values(hypothetical);
        return activeVariants.some((v) =>
            selectedIds.every((id) => v.option_value_ids.includes(id)),
        );
    };

    return (
        <div style={{ marginTop: 28 }} className="space-y-5">
            {options.map((option) => (
                <div key={option.id}>
                    <p
                        style={{
                            margin: '0 0 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: 'var(--color-muted-foreground, #6b7280)',
                        }}
                    >
                        {option.display_name}
                        {selectedOptionValues[option.id] !== undefined && (
                            <span
                                style={{
                                    marginLeft: 8,
                                    fontWeight: 400,
                                    textTransform: 'none',
                                    letterSpacing: 0,
                                    color: 'var(--color-foreground, #1a1a1a)',
                                    fontSize: 13,
                                }}
                            >
                                {option.values.find(
                                    (v) =>
                                        v.id === selectedOptionValues[option.id],
                                )?.label ?? ''}
                            </span>
                        )}
                    </p>
                    {option.visual_type === 'dropdown' ? (
                        <select
                            value={
                                selectedOptionValues[option.id] !== undefined
                                    ? String(selectedOptionValues[option.id])
                                    : ''
                            }
                            onChange={(e) => {
                                const id = parseInt(e.target.value, 10);
                                if (!isNaN(id)) {
                                    onSelect(option.id, id);
                                }
                            }}
                            style={{
                                padding: '9px 12px',
                                fontSize: 13,
                                fontWeight: 500,
                                border: '1.5px solid var(--color-border, #e5e7eb)',
                                borderRadius: 'var(--radius, 8px)',
                                backgroundColor: 'var(--color-card-bg, #fff)',
                                color: 'var(--color-foreground, #1a1a1a)',
                                fontFamily: 'var(--font-body, sans-serif)',
                                minWidth: 160,
                                cursor: 'pointer',
                            }}
                        >
                            <option value="" disabled>
                                Select {option.display_name}
                            </option>
                            {option.values.map((val) => {
                                const available = isValueAvailable(option.id, val.id);
                                return (
                                    <option
                                        key={val.id}
                                        value={String(val.id)}
                                        disabled={!available}
                                    >
                                        {val.label}
                                        {!available ? ' (out of stock)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {option.values.map((val) => {
                                const isSelected =
                                    selectedOptionValues[option.id] === val.id;
                                const available = isValueAvailable(option.id, val.id);

                                if (option.visual_type === 'color_swatch') {
                                    const hex = val.visual_data?.['hex'] as
                                        | string
                                        | undefined;
                                    return (
                                        <button
                                            key={val.id}
                                            type="button"
                                            title={val.label}
                                            disabled={!available}
                                            onClick={() => onSelect(option.id, val.id)}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                backgroundColor: hex ?? '#cccccc',
                                                border: isSelected
                                                    ? '2.5px solid var(--color-primary, #e94560)'
                                                    : '2px solid var(--color-border, #e5e7eb)',
                                                outline: isSelected
                                                    ? '2px solid color-mix(in srgb, var(--color-primary, #e94560) 30%, transparent)'
                                                    : 'none',
                                                outlineOffset: 1,
                                                cursor: available ? 'pointer' : 'not-allowed',
                                                opacity: !available ? 0.35 : 1,
                                                transition:
                                                    'border-color 0.15s ease, outline 0.15s ease, opacity 0.15s ease',
                                                flexShrink: 0,
                                            }}
                                            aria-label={val.label}
                                            aria-pressed={isSelected}
                                        />
                                    );
                                }

                                if (option.visual_type === 'image_swatch') {
                                    const imageUrl = val.visual_data?.['image_url'] as
                                        | string
                                        | undefined;
                                    return (
                                        <button
                                            key={val.id}
                                            type="button"
                                            title={val.label}
                                            disabled={!available}
                                            onClick={() => onSelect(option.id, val.id)}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 'var(--radius-sm, 4px)',
                                                border: isSelected
                                                    ? '2.5px solid var(--color-primary, #e94560)'
                                                    : '1.5px solid var(--color-border, #e5e7eb)',
                                                padding: 2,
                                                cursor: available ? 'pointer' : 'not-allowed',
                                                opacity: !available ? 0.35 : 1,
                                                overflow: 'hidden',
                                                backgroundColor: 'var(--color-card-bg, #fff)',
                                                transition:
                                                    'border-color 0.15s ease, opacity 0.15s ease',
                                                flexShrink: 0,
                                            }}
                                            aria-label={val.label}
                                            aria-pressed={isSelected}
                                        >
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={val.label}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: 2,
                                                        display: 'block',
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        color: 'var(--color-muted-foreground, #9ca3af)',
                                                    }}
                                                >
                                                    {val.label}
                                                </span>
                                            )}
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        key={val.id}
                                        type="button"
                                        disabled={!available}
                                        onClick={() => onSelect(option.id, val.id)}
                                        style={{
                                            padding: '10px 18px',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            border: isSelected
                                                ? '1.5px solid var(--color-primary, #e94560)'
                                                : '1.5px solid var(--color-border, #e5e7eb)',
                                            borderRadius: 'var(--radius, 8px)',
                                            backgroundColor: isSelected
                                                ? 'color-mix(in srgb, var(--color-primary, #e94560) 8%, transparent)'
                                                : 'var(--color-card-bg, #fff)',
                                            color: isSelected
                                                ? 'var(--color-primary, #e94560)'
                                                : !available
                                                  ? 'var(--color-muted-foreground, #9ca3af)'
                                                  : 'var(--color-foreground, #1a1a1a)',
                                            cursor: available ? 'pointer' : 'not-allowed',
                                            opacity: !available ? 0.5 : 1,
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            transition:
                                                'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease',
                                            textDecoration:
                                                !available && !isSelected
                                                    ? 'line-through'
                                                    : 'none',
                                        }}
                                    >
                                        {val.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function VariantChip({
    variant,
    selected,
    onSelect,
}: {
    variant: ProductVariantDetailData;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                border: selected
                    ? '1.5px solid var(--color-primary, #e94560)'
                    : '1.5px solid var(--color-border, #e5e7eb)',
                borderRadius: 'var(--radius, 8px)',
                backgroundColor: selected
                    ? 'color-mix(in srgb, var(--color-primary, #e94560) 8%, transparent)'
                    : 'var(--color-card-bg, #fff)',
                color: selected
                    ? 'var(--color-primary, #e94560)'
                    : 'var(--color-foreground, #1a1a1a)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body, sans-serif)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease',
            }}
        >
            {variant.name}
        </button>
    );
}

function QuantityStepper({
    quantity,
    onChange,
    max,
}: {
    quantity: number;
    onChange: (q: number) => void;
    max?: number;
}) {
    function dec() {
        if (quantity > 1) onChange(quantity - 1);
    }
    function inc() {
        if (max === undefined || quantity < max) onChange(quantity + 1);
    }

    const btnStyle: React.CSSProperties = {
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid var(--color-border, #e5e7eb)',
        backgroundColor: 'var(--color-card-bg, #fff)',
        color: 'var(--color-foreground, #1a1a1a)',
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 700,
        fontFamily: 'var(--font-body, sans-serif)',
    };

    return (
        <div className="inline-flex items-center">
            <button
                type="button"
                onClick={dec}
                style={{
                    ...btnStyle,
                    borderRadius: 'var(--radius, 8px) 0 0 var(--radius, 8px)',
                    borderRight: 'none',
                }}
                aria-label="Decrease quantity"
            >
                −
            </button>
            <span
                style={{
                    minWidth: 56,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--color-border, #e5e7eb)',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--color-foreground, #1a1a1a)',
                    fontFamily: 'var(--font-body, sans-serif)',
                    backgroundColor: 'var(--color-card-bg, #fff)',
                }}
            >
                {quantity}
            </span>
            <button
                type="button"
                onClick={inc}
                style={{
                    ...btnStyle,
                    borderRadius: '0 var(--radius, 8px) var(--radius, 8px) 0',
                    borderLeft: 'none',
                }}
                aria-label="Increase quantity"
            >
                +
            </button>
        </div>
    );
}
