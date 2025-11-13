import ProductController from '@/actions/App/Http/Controllers/ProductController';
import StockMovementHistory from '@/components/stock/StockMovementHistory';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import Pagination from '@/components/ui/pagination/Pagination';
import AppLayout from '@/layouts/AppLayout';
import { ProductVariant, StockMovement } from '@/types/stockMovement';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Package } from 'lucide-react';

interface PaginatedMovements {
    data: StockMovement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    variant: ProductVariant;
    movements: PaginatedMovements;
}

export default function History({ variant, movements }: Props) {
    const getTotalStock = (): number => {
        return (
            variant.inventory_locations?.reduce(
                (sum, loc) => sum + loc.quantity,
                0,
            ) || 0
        );
    };

    const getAvailableStock = (): number => {
        return (
            variant.inventory_locations?.reduce(
                (sum, loc) => sum + (loc.quantity - loc.reserved_quantity),
                0,
            ) || 0
        );
    };

    const totalStock = getTotalStock();
    const availableStock = getAvailableStock();
    const reservedStock = totalStock - availableStock;

    return (
        <AppLayout>
            <Head
                title={`Stock History - ${variant.product?.name || 'Product'} ${variant.name ? `- ${variant.name}` : ''}`}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href={
                            variant.product
                                ? ProductController.show.url({
                                      product: variant.product.id,
                                  })
                                : '#'
                        }
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Product
                    </Link>

                    <a
                        href={`/stock-movements/export?variant_id=${variant.id}`}
                        download
                    >
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export History
                        </Button>
                    </a>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Stock Movement History
                    </h1>
                    <div className="mt-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {variant.product?.name || 'Unknown Product'}
                        </p>
                        {variant.name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {variant.name}
                            </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            SKU: {variant.sku}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900/20">
                                <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Total Stock
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {totalStock}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900/20">
                                <Package className="h-5 w-5 text-success-600 dark:text-success-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Available
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {availableStock}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-warning-100 p-2 dark:bg-warning-900/20">
                                <Package className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Reserved
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {reservedStock}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Movements
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {movements.total}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card title="Movement History">
                    <StockMovementHistory movements={movements.data} />
                </Card>

                {movements.last_page > 1 && (
                    <Pagination
                        currentPage={movements.current_page}
                        onPageChange={() => {}}
                        totalPages={movements.last_page}
                    />
                )}
            </div>
        </AppLayout>
    );
}
