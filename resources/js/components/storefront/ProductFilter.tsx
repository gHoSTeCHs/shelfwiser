import { ProductCategory } from '@/types/product';
import { Shop } from '@/types/shop';
import { router } from '@inertiajs/react';
import React from 'react';
import Button from '@/components/ui/button/Button';
import { X } from 'lucide-react';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

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
        const params: any = {};
        if (categoryId) params.category = categoryId;
        if (currentSearch) params.search = currentSearch;
        if (currentSort) params.sort = currentSort;

        router.get(
            StorefrontController.products.url({ shop: shop.slug }),
            params,
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        router.get(
            StorefrontController.products.url({ shop: shop.slug }),
            {},
            { preserveState: true }
        );
    };

    const hasActiveFilters = currentCategory || currentSearch || currentSort;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
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
                <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                <div className="space-y-2">
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={`w-full text-left px-3 py-2 rounded-md transition ${
                            !currentCategory
                                ? 'bg-primary-100 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        All Products
                    </button>

                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition ${
                                currentCategory === category.id
                                    ? 'bg-primary-100 text-primary-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {currentSearch && (
                <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Active Search</h4>
                    <div className="bg-gray-100 px-3 py-2 rounded-md">
                        <p className="text-sm text-gray-700">"{currentSearch}"</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductFilter;
