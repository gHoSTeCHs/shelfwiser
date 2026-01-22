import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import ProductCard from '@/components/storefront/ProductCard';
import ProductFilter from '@/components/storefront/ProductFilter';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontProductsProps } from '@/types/storefront';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    Package,
    Search,
    X,
} from 'lucide-react';
import React from 'react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

/**
 * Product listing page with mobile-first design.
 * Features slide-out filter drawer on mobile, animated grid, and improved search.
 */
const Products: React.FC<StorefrontProductsProps> = ({
    shop,
    products,
    categories,
    filters,
    cartSummary,
}) => {
    const [searchQuery, setSearchQuery] = React.useState(filters.search || '');
    const [showMobileFilters, setShowMobileFilters] = React.useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string | number> = {};
        if (searchQuery) params.search = searchQuery;
        if (filters.category) params.category = filters.category;
        if (filters.sort) params.sort = filters.sort;

        router.get(
            StorefrontController.products.url({ shop: shop.slug }),
            params,
            { preserveState: true },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            StorefrontController.products.url({ shop: shop.slug }),
            { ...filters, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const selectedCategory = categories.find(
        (cat) => cat.id === filters.category,
    );

    const activeFiltersCount = [filters.category, filters.search].filter(
        Boolean,
    ).length;

    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-4 sm:space-y-6">
                {/* Breadcrumbs */}
                <Breadcrumbs
                    items={[
                        {
                            label: 'Home',
                            href: StorefrontController.index.url({
                                shop: shop.slug,
                            }),
                        },
                        { label: 'Products' },
                        ...(selectedCategory
                            ? [{ label: selectedCategory.name }]
                            : []),
                    ]}
                />

                {/* Header with search and filter button */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                            {selectedCategory
                                ? selectedCategory.name
                                : 'All Products'}
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {products.total}{' '}
                            {products.total === 1 ? 'product' : 'products'}
                        </p>
                    </div>

                    {/* Mobile filter button */}
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 lg:hidden dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch}>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-11 text-sm text-gray-900 transition-shadow placeholder:text-gray-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 focus:outline-none sm:text-base dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-500"
                        />
                        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    </div>
                </form>

                {/* Main content grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
                    {/* Desktop sidebar filter */}
                    <aside className="hidden rounded-xl border border-gray-200 bg-white p-4 lg:block dark:border-navy-700 dark:bg-navy-800">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
                            Filters
                        </h2>
                        <ProductFilter
                            shop={shop}
                            categories={categories}
                            currentCategory={filters.category}
                            currentSearch={filters.search}
                            currentSort={filters.sort}
                        />
                    </aside>

                    {/* Products grid */}
                    <div className="lg:col-span-3">
                        {products.data.length > 0 ? (
                            <>
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3"
                                >
                                    {products.data.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            variants={itemVariants}
                                        >
                                            <ProductCard
                                                product={product}
                                                shop={shop}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Pagination */}
                                {products.last_page > 1 && (
                                    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handlePageChange(
                                                    products.current_page - 1,
                                                )
                                            }
                                            disabled={
                                                products.current_page === 1
                                            }
                                            startIcon={
                                                <ChevronLeft className="h-4 w-4" />
                                            }
                                        >
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                {
                                                    length: Math.min(
                                                        5,
                                                        products.last_page,
                                                    ),
                                                },
                                                (_, i) => {
                                                    let page: number;
                                                    if (
                                                        products.last_page <= 5
                                                    ) {
                                                        page = i + 1;
                                                    } else if (
                                                        products.current_page <=
                                                        3
                                                    ) {
                                                        page = i + 1;
                                                    } else if (
                                                        products.current_page >=
                                                        products.last_page - 2
                                                    ) {
                                                        page =
                                                            products.last_page -
                                                            4 +
                                                            i;
                                                    } else {
                                                        page =
                                                            products.current_page -
                                                            2 +
                                                            i;
                                                    }
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() =>
                                                                handlePageChange(
                                                                    page,
                                                                )
                                                            }
                                                            className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                                                                page ===
                                                                products.current_page
                                                                    ? 'bg-brand-500 text-white'
                                                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-700'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handlePageChange(
                                                    products.current_page + 1,
                                                )
                                            }
                                            disabled={
                                                products.current_page ===
                                                products.last_page
                                            }
                                            endIcon={
                                                <ChevronRight className="h-4 w-4" />
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptyState
                                icon={<Package className="h-12 w-12" />}
                                title="No products found"
                                description={
                                    filters.search || filters.category
                                        ? 'Try adjusting your filters or search query.'
                                        : 'Check back soon for new products.'
                                }
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile filter drawer */}
            <AnimatePresence>
                {showMobileFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileFilters(false)}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 200,
                            }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-[300px] max-w-[85vw] bg-white shadow-xl lg:hidden dark:bg-navy-900"
                        >
                            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4 dark:border-navy-800">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Filters
                                </h2>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-4">
                                <ProductFilter
                                    shop={shop}
                                    categories={categories}
                                    currentCategory={filters.category}
                                    currentSearch={filters.search}
                                    currentSort={filters.sort}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </StorefrontLayout>
    );
};

export default Products;
