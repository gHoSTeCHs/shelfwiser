import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency } from '@/lib/formatters';
import { getCatalogVisibilityColor, getCatalogVisibilityLabel } from '@/lib/status-configs';
import {
    CatalogVisibility,
    SupplierCatalogItem,
    Tenant,
} from '@/types/supplier';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    DollarSign,
    Package,
    ShoppingCart,
    Store,
    TrendingUp,
} from 'lucide-react';

interface Props {
    catalogItems: SupplierCatalogItem[];
    supplier: Tenant | null;
}

export default function Browse({ catalogItems, supplier }: Props) {
    return (
        <AppLayout>
            <Head title="Browse Supplier Catalog" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {supplier
                            ? `${supplier.name} Catalog`
                            : 'Browse Supplier Catalogs'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {supplier
                            ? `Products available from ${supplier.name}`
                            : 'Browse and compare products from all your suppliers'}
                    </p>
                </div>

                {catalogItems.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No products found"
                        description={
                            supplier
                                ? 'This supplier has no products available in their catalog yet'
                                : 'No supplier catalogs are currently available. Connect with suppliers to start browsing their products.'
                        }
                        action={
                            <Link href="/supplier/connections">
                                <Button>
                                    <Store className="mr-2 h-4 w-4" />
                                    Manage Connections
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {catalogItems.map((item) => (
                            <Card key={item.id} className="overflow-hidden">
                                <div className="p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {item.product?.name || 'N/A'}
                                            </h3>
                                            {item.supplier_tenant && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    <Store className="mr-1 inline h-3.5 w-3.5" />
                                                    {item.supplier_tenant.name}
                                                </p>
                                            )}
                                        </div>
                                        <Badge color={getCatalogVisibilityColor(item.visibility)}>
                                            {getCatalogVisibilityLabel(item.visibility)}
                                        </Badge>
                                    </div>

                                    {item.description && (
                                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                            {item.description}
                                        </p>
                                    )}

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3 dark:bg-brand-950/50">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                                    Base Price
                                                </span>
                                            </div>
                                            <span className="text-lg font-bold text-brand-900 dark:text-brand-100">
                                                {formatCurrency(item.base_wholesale_price, 'USD')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Min Order
                                                </p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {item.min_order_quantity}{' '}
                                                    units
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Status
                                                </p>
                                                <Badge
                                                    color={
                                                        item.is_available
                                                            ? 'success'
                                                            : 'error'
                                                    }
                                                    size="sm"
                                                >
                                                    {item.is_available
                                                        ? 'Available'
                                                        : 'Unavailable'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {item.pricing_tiers &&
                                            item.pricing_tiers.length > 0 && (
                                                <div className="border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-950/50 rounded-lg border p-3">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <TrendingUp className="text-info-600 dark:text-info-400 h-4 w-4" />
                                                        <span className="text-info-900 dark:text-info-200 text-sm font-medium">
                                                            Volume Pricing
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {item.pricing_tiers
                                                            .slice(0, 2)
                                                            .map((tier) => (
                                                                <div
                                                                    key={
                                                                        tier.id
                                                                    }
                                                                    className="text-info-700 dark:text-info-300 flex items-center justify-between text-xs"
                                                                >
                                                                    <span>
                                                                        {
                                                                            tier.min_quantity
                                                                        }
                                                                        {tier.max_quantity &&
                                                                            `-${tier.max_quantity}`}{' '}
                                                                        units
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {formatCurrency(tier.price, 'USD')}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        {item.pricing_tiers
                                                            .length > 2 && (
                                                            <p className="text-info-600 dark:text-info-400 text-xs">
                                                                +
                                                                {item
                                                                    .pricing_tiers
                                                                    .length -
                                                                    2}{' '}
                                                                more tier
                                                                {item
                                                                    .pricing_tiers
                                                                    .length -
                                                                    2 >
                                                                1
                                                                    ? 's'
                                                                    : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            disabled={!item.is_available}
                                        >
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Add to PO
                                        </Button>
                                    </div>

                                    {!item.is_available && (
                                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-50 p-2 dark:bg-warning-950/50">
                                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-600 dark:text-warning-400" />
                                            <p className="text-xs text-warning-700 dark:text-warning-300">
                                                This product is currently
                                                unavailable from this supplier
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

Browse.layout = (page: React.ReactNode) => page;
