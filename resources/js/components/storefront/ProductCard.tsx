import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Badge from '@/components/ui/badge/Badge';
import { Product } from '@/types/product';
import { Shop } from '@/types/shop';
import { Link } from '@inertiajs/react';
import { ImageIcon } from 'lucide-react';
import React from 'react';
import PriceDisplay from './PriceDisplay';

interface ProductCardProps {
    product: Product;
    shop: Shop;
}

/**
 * Product card with playful-luxury styling.
 * Features image zoom on hover, warm-glow effect, and smooth transitions.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, shop }) => {
    const mainVariant = product.variants?.[0];
    const availableStock = mainVariant?.available_stock ?? 0;
    const hasStock = mainVariant && availableStock > 0;
    const isLowStock = hasStock && availableStock <= 10;

    return (
        <Link
            href={StorefrontController.show.url({
                shop: shop.slug,
                product: product.slug,
            })}
            className="group block h-full"
        >
            <article className="relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800 dark:hover:border-brand-500 dark:hover:shadow-brand-500/10">
                {/* Image container */}
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-navy-700">
                    {product.images?.[0]?.url ? (
                        <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-navy-500">
                            <ImageIcon
                                className="h-12 w-12 sm:h-16 sm:w-16"
                                strokeWidth={1}
                            />
                        </div>
                    )}

                    {/* Stock badges - absolute positioned */}
                    {!hasStock && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <Badge color="error" size="sm">
                                Out of Stock
                            </Badge>
                        </div>
                    )}
                    {isLowStock && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <Badge color="warning" size="sm">
                                Low Stock
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                    {/* Category */}
                    {product.category && (
                        <p className="mb-1 text-[10px] font-medium tracking-wide text-brand-600 uppercase sm:text-xs dark:text-brand-400">
                            {product.category.name}
                        </p>
                    )}

                    {/* Product name */}
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-brand-600 sm:text-base dark:text-white dark:group-hover:text-brand-400">
                        {product.name}
                    </h3>

                    {/* SKU */}
                    {mainVariant?.sku && (
                        <p className="mt-0.5 text-[10px] text-gray-400 sm:text-xs dark:text-gray-500">
                            SKU: {mainVariant.sku}
                        </p>
                    )}

                    {/* Price */}
                    <div className="mt-2 sm:mt-3">
                        {mainVariant && (
                            <PriceDisplay
                                price={mainVariant.price}
                                retailPrice={(mainVariant as { retail_price?: number }).retail_price}
                                shop={shop}
                                size="md"
                            />
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default ProductCard;
