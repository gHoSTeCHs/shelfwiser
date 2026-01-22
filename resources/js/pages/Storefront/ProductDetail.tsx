import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Select from '@/components/form/Select';
import AddToCartButton from '@/components/storefront/AddToCartButton';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import PriceDisplay from '@/components/storefront/PriceDisplay';
import ProductCard from '@/components/storefront/ProductCard';
import QuantitySelector from '@/components/storefront/QuantitySelector';
import Badge from '@/components/ui/badge/Badge';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontProductDetailProps } from '@/types/storefront';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import React from 'react';

/**
 * Individual product detail page with playful-luxury styling.
 * Shows product images, variants, description, and add to cart functionality.
 */
const ProductDetail: React.FC<StorefrontProductDetailProps> = ({
    shop,
    product,
    relatedProducts,
    cartSummary,
}) => {
    const [selectedVariantId, setSelectedVariantId] = React.useState(
        product.variants?.[0]?.id || 0,
    );
    const [selectedPackagingId, setSelectedPackagingId] = React.useState<
        number | null
    >(null);
    const [quantity, setQuantity] = React.useState(1);

    const selectedVariant = product.variants?.find(
        (v) => v.id === selectedVariantId,
    );
    const availableStock = selectedVariant?.available_stock || 0;

    const variantOptions =
        product.variants?.map((variant) => ({
            value: variant.id.toString(),
            label: `${variant.sku} - ${shop.currency_symbol}${Number(variant.price).toFixed(2)}`,
        })) || [];

    const packagingOptions =
        selectedVariant?.packaging_types?.map((packaging) => ({
            value: packaging.id.toString(),
            label: packaging.name,
        })) || [];

    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-8 sm:space-y-12">
                <Breadcrumbs
                    items={[
                        {
                            label: 'Home',
                            href: StorefrontController.index.url({
                                shop: shop.slug,
                            }),
                        },
                        {
                            label: 'Products',
                            href: StorefrontController.products.url({
                                shop: shop.slug,
                            }),
                        },
                        ...(product.category
                            ? [{ label: product.category.name }]
                            : []),
                        { label: product.name },
                    ]}
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
                    {/* Product Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 sm:rounded-3xl dark:bg-navy-800"
                    >
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-navy-500">
                                <ImageIcon
                                    className="h-24 w-24 sm:h-32 sm:w-32"
                                    strokeWidth={1}
                                />
                            </div>
                        )}

                        {/* Stock badge overlay */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                            {availableStock > 0 ? (
                                availableStock <= 10 && (
                                    <Badge color="warning" size="sm">
                                        Only {availableStock} left
                                    </Badge>
                                )
                            ) : (
                                <Badge color="error" size="sm">
                                    Out of Stock
                                </Badge>
                            )}
                        </div>
                    </motion.div>

                    {/* Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="space-y-5 sm:space-y-6"
                    >
                        {/* Category & Name */}
                        <div>
                            {product.category && (
                                <p className="mb-2 text-xs font-medium tracking-wide text-brand-600 uppercase sm:text-sm dark:text-brand-400">
                                    {product.category.name}
                                </p>
                            )}
                            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl dark:text-white">
                                {product.name}
                            </h1>
                            {selectedVariant && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    SKU: {selectedVariant.sku}
                                </p>
                            )}
                        </div>

                        {/* Price */}
                        {selectedVariant && (
                            <div className="flex items-baseline gap-3">
                                <PriceDisplay
                                    price={selectedVariant.price}
                                    retailPrice={selectedVariant.retail_price}
                                    shop={shop}
                                    size="lg"
                                    showTaxLabel={true}
                                />
                            </div>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-3">
                            {availableStock > 0 ? (
                                <>
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-success-500" />
                                    <span className="text-sm font-medium text-success-700 dark:text-success-400">
                                        In Stock
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({availableStock} available)
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-error-500" />
                                    <span className="text-sm font-medium text-error-600 dark:text-error-400">
                                        Out of Stock
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                                {product.description}
                            </p>
                        )}

                        {/* Purchase Options Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                            <div className="space-y-4">
                                {/* Variant Selection */}
                                {product.variants &&
                                    product.variants.length > 1 && (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                                                Select Variant
                                            </label>
                                            <Select
                                                options={variantOptions}
                                                defaultValue={selectedVariantId.toString()}
                                                onChange={(value) => {
                                                    setSelectedVariantId(
                                                        parseInt(value),
                                                    );
                                                    setQuantity(1);
                                                }}
                                            />
                                        </div>
                                    )}

                                {/* Packaging Selection */}
                                {packagingOptions.length > 0 && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                                            Packaging Type{' '}
                                            <span className="text-gray-400">
                                                (Optional)
                                            </span>
                                        </label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Standard',
                                                },
                                                ...packagingOptions,
                                            ]}
                                            defaultValue={
                                                selectedPackagingId?.toString() ||
                                                ''
                                            }
                                            onChange={(value) =>
                                                setSelectedPackagingId(
                                                    value
                                                        ? parseInt(value)
                                                        : null,
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {/* Quantity */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
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

                                {/* Add to Cart */}
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
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                            You May Also Like
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    shop={shop}
                                />
                            ))}
                        </div>
                    </motion.section>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default ProductDetail;
