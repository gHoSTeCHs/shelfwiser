import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontProductDetailProps } from '@/types/storefront';
import React from 'react';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import PriceDisplay from '@/components/storefront/PriceDisplay';
import QuantitySelector from '@/components/storefront/QuantitySelector';
import AddToCartButton from '@/components/storefront/AddToCartButton';
import ProductCard from '@/components/storefront/ProductCard';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import Select from '@/components/form/Select';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

/**
 * Individual product detail page.
 * Shows product images, variants, description, and add to cart functionality.
 */
const ProductDetail: React.FC<StorefrontProductDetailProps> = ({
    shop,
    product,
    relatedProducts,
    cartSummary,
}) => {
    const [selectedVariantId, setSelectedVariantId] = React.useState(
        product.variants?.[0]?.id || 0
    );
    const [selectedPackagingId, setSelectedPackagingId] = React.useState<number | null>(null);
    const [quantity, setQuantity] = React.useState(1);

    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
    const availableStock = selectedVariant?.available_stock || 0;

    const variantOptions = product.variants?.map(variant => ({
        value: variant.id.toString(),
        label: `${variant.sku} - ${shop.currency_symbol}${variant.price.toFixed(2)}`,
    })) || [];

    const packagingOptions = selectedVariant?.packaging_types?.map(packaging => ({
        value: packaging.id.toString(),
        label: packaging.name,
    })) || [];

    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-8">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: StorefrontController.index.url({ shop: shop.slug }) },
                        { label: 'Products', href: StorefrontController.products.url({ shop: shop.slug }) },
                        ...(product.category ? [{ label: product.category.name }] : []),
                        { label: product.name },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            {product.category && (
                                <p className="text-sm text-gray-500 mb-2">
                                    {product.category.name}
                                </p>
                            )}
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {product.name}
                            </h1>
                            {selectedVariant && (
                                <p className="text-sm text-gray-500">
                                    SKU: {selectedVariant.sku}
                                </p>
                            )}
                        </div>

                        {selectedVariant && (
                            <PriceDisplay
                                price={selectedVariant.price}
                                retailPrice={selectedVariant.retail_price}
                                shop={shop}
                                size="lg"
                                showTaxLabel={true}
                            />
                        )}

                        <div className="flex items-center gap-2">
                            {availableStock > 0 ? (
                                <>
                                    <Badge color="success">In Stock</Badge>
                                    <span className="text-sm text-gray-600">
                                        {availableStock} available
                                    </span>
                                </>
                            ) : (
                                <Badge color="error">Out of Stock</Badge>
                            )}
                        </div>

                        {product.description && (
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-600">{product.description}</p>
                            </div>
                        )}

                        <Card className="p-6 space-y-4">
                            {product.variants && product.variants.length > 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Select Variant
                                    </label>
                                    <Select
                                        options={variantOptions}
                                        defaultValue={selectedVariantId.toString()}
                                        onChange={(value) => {
                                            setSelectedVariantId(parseInt(value));
                                            setQuantity(1);
                                        }}
                                    />
                                </div>
                            )}

                            {packagingOptions.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Packaging Type (Optional)
                                    </label>
                                    <Select
                                        options={[
                                            { value: '', label: 'Standard' },
                                            ...packagingOptions,
                                        ]}
                                        defaultValue={selectedPackagingId?.toString() || ''}
                                        onChange={(value) => setSelectedPackagingId(value ? parseInt(value) : null)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Quantity
                                </label>
                                <QuantitySelector
                                    quantity={quantity}
                                    onChange={setQuantity}
                                    min={1}
                                    max={availableStock}
                                    disabled={availableStock === 0}
                                />
                            </div>

                            {selectedVariant && (
                                <AddToCartButton
                                    shop={shop}
                                    variantId={selectedVariant.id}
                                    quantity={quantity}
                                    packagingTypeId={selectedPackagingId}
                                    availableStock={availableStock}
                                    fullWidth
                                    size="lg"
                                />
                            )}
                        </Card>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Related Products
                    </h2>
                    {relatedProducts && relatedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    shop={shop}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No related products available at this time.</p>
                        </div>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default ProductDetail;
