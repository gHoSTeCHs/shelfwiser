import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontServicesProps } from '@/types/storefront';
import { router } from '@inertiajs/react';
import React from 'react';
import ServiceCard from '@/components/storefront/ServiceCard';
import ServiceFilter from '@/components/storefront/ServiceFilter';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Briefcase, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

/**
 * Service listing page with filtering, sorting, and pagination.
 * Displays services in a grid with category filters and search.
 */
const Services: React.FC<StorefrontServicesProps> = ({
    shop,
    services,
    categories,
    filters,
    cartSummary,
}) => {
    const [searchQuery, setSearchQuery] = React.useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params: any = {};
        if (searchQuery) params.search = searchQuery;
        if (filters.category) params.category = filters.category;
        if (filters.sort) params.sort = filters.sort;

        router.get(
            StorefrontController.services.url({ shop: shop.slug }),
            params,
            { preserveState: true }
        );
    };

    const handleSortChange = (value: string) => {
        const params: any = {};
        if (value) params.sort = value;
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;

        router.get(
            StorefrontController.services.url({ shop: shop.slug }),
            params,
            { preserveState: true }
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            StorefrontController.services.url({ shop: shop.slug }),
            { ...filters, page },
            { preserveState: true, preserveScroll: true }
        );
    };

    const sortOptions = [
        { value: '', label: 'Default' },
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'price_low', label: 'Price (Low to High)' },
        { value: 'price_high', label: 'Price (High to Low)' },
        { value: 'newest', label: 'Newest First' },
    ];

    const selectedCategory = categories.find(cat => cat.id === filters.category);

    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-6">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: StorefrontController.index.url({ shop: shop.slug }) },
                        { label: 'Services' },
                        ...(selectedCategory ? [{ label: selectedCategory.name }] : []),
                    ]}
                />

                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search services..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                    </form>

                    <div className="w-full md:w-48">
                        {/*<Select*/}
                        {/*    options={sortOptions}*/}
                        {/*    defaultValue={filters.sort || ''}*/}
                        {/*    onChange={handleSortChange}*/}
                        {/*    placeholder="Sort by"*/}
                        {/*/>*/}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                        <ServiceFilter
                            shop={shop}
                            categories={categories}
                            currentCategory={filters.category}
                            currentSearch={filters.search}
                            currentSort={filters.sort}
                        />
                    </aside>

                    <div className="lg:col-span-3">
                        <div className="mb-4 flex justify-between items-center">
                            <p className="text-gray-600 dark:text-gray-400">
                                {services.total} {services.total === 1 ? 'service' : 'services'} found
                            </p>
                        </div>

                        {services.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {services.data.map((service) => (
                                        <ServiceCard
                                            key={service.id}
                                            service={service}
                                            shop={shop}
                                        />
                                    ))}
                                </div>

                                {services.last_page > 1 && (
                                    <div className="flex justify-center items-center space-x-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => handlePageChange(services.current_page - 1)}
                                            disabled={services.current_page === 1}
                                            startIcon={<ChevronLeft />}
                                        >
                                            Previous
                                        </Button>

                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Page {services.current_page} of {services.last_page}
                                        </span>

                                        <Button
                                            variant="outline"
                                            onClick={() => handlePageChange(services.current_page + 1)}
                                            disabled={services.current_page === services.last_page}
                                            endIcon={<ChevronRight />}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptyState
                                icon={<Briefcase />}
                                title="No services found"
                                description={
                                    filters.search || filters.category
                                        ? 'Try adjusting your filters or search query.'
                                        : 'Check back soon for new services.'
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default Services;
