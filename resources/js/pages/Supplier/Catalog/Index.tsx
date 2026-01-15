import SupplierCatalogController from '@/actions/App/Http/Controllers/SupplierCatalogController.ts';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import {
    CatalogVisibility,
    SupplierCatalogListResponse,
} from '@/types/supplier';
import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign,
    Edit,
    Eye,
    EyeOff,
    Package,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    catalogItems: SupplierCatalogListResponse;
}

const visibilityConfig: Record<
    CatalogVisibility,
    { label: string; variant: 'primary' | 'success' | 'warning' }
> = {
    public: { label: 'Public', variant: 'success' },
    private: { label: 'Private', variant: 'primary' },
    connections_only: { label: 'Connections Only', variant: 'warning' },
};

export default function Index({ catalogItems }: Props) {
    const [deleteConfirm, setDeleteConfirm] = useState<{
        id: number;
        productName: string;
    } | null>(null);

    const handleDelete = () => {
        if (deleteConfirm) {
            router.delete(
                SupplierCatalogController.destroy.url({ id: deleteConfirm.id }),
            );
            setDeleteConfirm(null);
        }
    };

    return (
        <>
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
                    <Link href={SupplierCatalogController.create.url()}>
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
                            <Link href={SupplierCatalogController.create.url()}>
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
                                        <Badge
                                            variant="light"
                                            color={
                                                item.is_available
                                                    ? 'success'
                                                    : 'primary'
                                            }
                                        >
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
                                                $
                                                {Number(
                                                    item.base_wholesale_price,
                                                ).toFixed(2)}
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
                                        {item.pricing_tiers &&
                                            item.pricing_tiers.length > 0 && (
                                                <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                                                    <DollarSign className="h-3 w-3" />
                                                    <span>
                                                        {
                                                            item.pricing_tiers
                                                                .length
                                                        }{' '}
                                                        pricing tiers
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    <div className="mt-4">
                                        <Badge
                                            variant={'light'}
                                            color={
                                                visibilityConfig[
                                                    item.visibility
                                                ].variant
                                            }
                                            size="sm"
                                        >
                                            {
                                                visibilityConfig[
                                                    item.visibility
                                                ].label
                                            }
                                        </Badge>
                                    </div>

                                    {item.description && (
                                        <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex border-t bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                    <Link
                                        href={SupplierCatalogController.edit({
                                            id: item.id,
                                        })}
                                        className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() =>
                                            setDeleteConfirm({
                                                id: item.id,
                                                productName:
                                                    item.product?.name ||
                                                    'this product',
                                            })
                                        }
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

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove from Catalog"
                message={`Are you sure you want to remove "${deleteConfirm?.productName}" from your supplier catalog?`}
                confirmLabel="Remove"
                variant="danger"
            />
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
