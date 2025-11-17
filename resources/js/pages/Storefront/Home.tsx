import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontHomeProps } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import React from 'react';
import ProductCard from '@/components/storefront/ProductCard';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Package, ArrowRight } from 'lucide-react';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

/**
 * Storefront homepage displaying featured products and categories.
 * Entry point for customer shopping experience.
 */
const Home: React.FC<StorefrontHomeProps> = ({ shop, featuredProducts, categories, cartSummary }) => {
    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-12">
                <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-8 md:p-12">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Welcome to {shop.name}
                        </h1>
                        <p className="text-xl mb-8 text-primary-100">
                            {shop.description || 'Discover our quality products and enjoy a seamless shopping experience.'}
                        </p>
                        <Link href={StorefrontController.products.url({ shop: shop.slug })}>
                            <Button variant="secondary" size="lg" endIcon={<ArrowRight />}>
                                Browse Products
                            </Button>
                        </Link>
                    </div>
                </section>

                {categories && categories.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Shop by Category
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={StorefrontController.products.url({
                                        shop: shop.slug,
                                    }) + `?category=${category.id}`}
                                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition text-center"
                                >
                                    <h3 className="font-semibold text-gray-900">
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {category.description}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Featured Products
                        </h2>
                        <Link href={StorefrontController.products.url({ shop: shop.slug })}>
                            <Button variant="outline" endIcon={<ArrowRight />}>
                                View All
                            </Button>
                        </Link>
                    </div>

                    {featuredProducts && featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    shop={shop}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<Package />}
                            title="No products available"
                            description="Check back soon for new products."
                        />
                    )}
                </section>

                {shop.storefront_settings?.business_hours && (
                    <section className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Business Hours
                        </h3>
                        <p className="text-gray-600">
                            {shop.storefront_settings.business_hours}
                        </p>
                    </section>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default Home;
