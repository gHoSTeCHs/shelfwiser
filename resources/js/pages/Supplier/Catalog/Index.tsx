import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { SupplierCatalogListResponse, CatalogVisibility } from '@/types/supplier';
import { Head, Link, router } from '@inertiajs/react';
import { Package, Plus, Eye, EyeOff, Edit, Trash2, DollarSign } from 'lucide-react';

interface Props {
    catalogItems: SupplierCatalogListResponse;
}

const visibilityConfig: Record<CatalogVisibility, { label: string; variant: 'default' | 'success' | 'warning' }> = {
    public: { label: 'Public', variant: 'success' },
    private: { label: 'Private', variant: 'default' },
    connections_only: { label: 'Connections Only', variant: 'warning' },
};

export default function Index({ catalogItems }: Props) {
    const handleDelete = (id: number, productName: string) => {
        if (confirm(`Are you sure you want to remove "${productName}" from your supplier catalog?`)) {
            router.delete(route('supplier.catalog.destroy', id));
        }
    };

    return (
        <AppLayout>
            <Head title="Supplier Catalog" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Supplier Catalog
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage products available to buyers
                        </p>
                    </div>
                    <Link href={route('supplier.catalog.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {catalogItems.data.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No products in catalog"
                        description="Add products to your supplier catalog to start selling to other businesses"
                        action={
                            <Link href={route('supplier.catalog.create')}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Product
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {catalogItems.data.map((item) => (
                            <Card key={item.id} className="overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {item.product?.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                SKU: {item.product?.slug}
                                            </p>
                                        </div>
                                        <Badge variant={item.is_available ? 'success' : 'secondary'}>
                                            {item.is_available ? (
                                                <>
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    Available
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff className="mr-1 h-3 w-3" />
                                                    Unavailable
                                                </>
                                            )}
                                        </Badge>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Base Price:
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${item.base_wholesale_price.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Min. Order:
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {item.min_order_quantity} units
                                            </span>
                                        </div>
                                        {item.pricing_tiers && item.pricing_tiers.length > 0 && (
                                            <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                                                <DollarSign className="h-3 w-3" />
                                                <span>{item.pricing_tiers.length} pricing tiers</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <Badge variant={visibilityConfig[item.visibility].variant} size="sm">
                                            {visibilityConfig[item.visibility].label}
                                        </Badge>
                                    </div>

                                    {item.description && (
                                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex border-t bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                    <Link
                                        href={route('supplier.catalog.edit', item.id)}
                                        className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(item.id, item.product?.name || 'this product')}
                                        className="flex flex-1 items-center justify-center gap-2 border-l px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
