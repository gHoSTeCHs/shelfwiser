import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Button from '@/components/ui/button/Button';
import { ProductCategory } from '@/types/product';
import { Shop } from '@/types/shop';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import React from 'react';

interface ProductFilterProps {
    shop: Shop;
    categories: ProductCategory[];
    currentCategory?: number;
    currentSearch?: string;
    currentSort?: string;
}

/**
 * Product filter sidebar with category selection and search.
 * Handles filter application and clearing with proper URL state management.
 */
const ProductFilter: React.FC<ProductFilterProps> = ({
    shop,
    categories,
    currentCategory,
    currentSearch,
    currentSort,
}) => {
    const handleCategoryClick = (categoryId: number | null) => {
        const params: Record<string, string | number> = {};
        if (categoryId) params.category = categoryId;
        if (currentSearch) params.search = currentSearch;
        if (currentSort) params.sort = currentSort;

        router.get(
            StorefrontController.products.url({ shop: shop.slug }),
            params,
            { preserveState: true },
        );
    };

    const handleClearFilters = () => {
        router.get(
            StorefrontController.products.url({ shop: shop.slug }),
            {},
            { preserveState: true },
        );
    };

    const hasActiveFilters = currentCategory || currentSearch || currentSort;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        startIcon={<X />}
                    >
                        Clear
                    </Button>
                )}
            </div>

            <div>
                <h4 className="mb-3 font-medium text-gray-900">Categories</h4>
                <div className="space-y-2">
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={`w-full rounded-md px-3 py-2 text-left transition ${
                            !currentCategory
                                ? 'bg-brand-100 font-medium text-brand-700'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        All Products
                    </button>

                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className={`w-full rounded-md px-3 py-2 text-left transition ${
                                currentCategory === category.id
                                    ? 'bg-brand-100 font-medium text-brand-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {currentSearch && (
                <div className="border-t pt-4">
                    <h4 className="mb-2 font-medium text-gray-900">
                        Active Search
                    </h4>
                    <div className="rounded-md bg-gray-100 px-3 py-2">
                        <p className="text-sm text-gray-700">
                            "{currentSearch}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductFilter;
