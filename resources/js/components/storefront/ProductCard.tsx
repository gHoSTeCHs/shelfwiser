import { Product } from '@/types/product';
import { Shop } from '@/types/shop';
import { Link } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import PriceDisplay from './PriceDisplay';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

interface ProductCardProps {
    product: Product;
    shop: Shop;
}

/**
 * Reusable product card component for displaying products in grids.
 * Shows product image, name, price, stock status, and link to detail page.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, shop }) => {
    const mainVariant = product.variants?.[0];
    const hasStock = mainVariant && mainVariant.available_stock > 0;

    return (
        <Link href={StorefrontController.show.url({ shop: shop.slug, product: product.slug })}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="mb-2">
                        {product.category && (
                            <p className="text-xs text-gray-500 mb-1">
                                {product.category.name}
                            </p>
                        )}
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                            {product.name}
                        </h3>
                        {mainVariant?.sku && (
                            <p className="text-xs text-gray-500">
                                SKU: {mainVariant.sku}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        {mainVariant && (
                            <PriceDisplay
                                price={mainVariant.price}
                                retailPrice={mainVariant.retail_price}
                                shop={shop}
                                size="md"
                            />
                        )}

                        {!hasStock && (
                            <Badge color="error" size="sm">
                                Out of Stock
                            </Badge>
                        )}

                        {hasStock && mainVariant && mainVariant.available_stock <= 10 && (
                            <Badge color="warning" size="sm">
                                Low Stock
                            </Badge>
                        )}
                    </div>

                    {product.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {product.description}
                        </p>
                    )}
                </div>
            </Card>
        </Link>
    );
};

export default ProductCard;
