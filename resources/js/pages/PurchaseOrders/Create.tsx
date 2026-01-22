import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import AppLayout from '@/layouts/AppLayout';
import { calculateSubtotal } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { PaginatedResponse } from '@/types';
import { Shop } from '@/types/shop';
import { SupplierCatalogItem, SupplierConnection } from '@/types/supplier';
import { Form, Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Loader2,
    Minus,
    Package,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

interface Props {
    shops: Shop[];
    supplierConnections: SupplierConnection[];
    supplierCatalog?: PaginatedResponse<SupplierCatalogItem> | null;
    selectedSupplierId?: number;
}

interface CartItem {
    catalog_item_id: number;
    catalog_item: SupplierCatalogItem;
    quantity: number;
    unit_price: number;
}

interface CatalogItemProps {
    item: SupplierCatalogItem;
    isInCart: boolean;
    onAddToCart: (item: SupplierCatalogItem) => void;
}

const CatalogItem = memo(function CatalogItem({
    item,
    isInCart,
    onAddToCart,
}: CatalogItemProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.product?.name}
                    </h4>
                    {item.pricing_tiers && item.pricing_tiers.length > 0 && (
                        <Badge variant="light" color="primary" size="sm">
                            Volume Pricing
                        </Badge>
                    )}
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Base: {formatCurrency(item.base_wholesale_price, 'USD')}</span>
                    <span>Min. Order: {item.min_order_quantity}</span>
                </div>
                {item.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                    </p>
                )}
            </div>
            <Button
                size="sm"
                onClick={() => onAddToCart(item)}
                disabled={isInCart}
            >
                <Plus className="mr-1 h-4 w-4" />
                {isInCart ? 'Added' : 'Add'}
            </Button>
        </div>
    );
});

export default function Create({
    shops,
    supplierConnections,
    supplierCatalog,
    selectedSupplierId,
}: Props) {
    const [selectedShop, setSelectedShop] = useState<string>(
        shops[0]?.id.toString() || '',
    );
    const [selectedSupplier, setSelectedSupplier] = useState<string>(
        selectedSupplierId?.toString() || '',
    );
    const [catalog, setCatalog] = useState<SupplierCatalogItem[]>(
        supplierCatalog?.data || [],
    );
    const [catalogMeta, setCatalogMeta] = useState<{
        currentPage: number;
        lastPage: number;
        total: number;
    } | null>(
        supplierCatalog
            ? {
                  currentPage: supplierCatalog.current_page,
                  lastPage: supplierCatalog.last_page,
                  total: supplierCatalog.total,
              }
            : null,
    );
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (selectedSupplier) {
            setLoadingCatalog(true);
            setCatalog([]);
            router.get(
                PurchaseOrderController.create.url({
                    query: {
                        supplier: selectedSupplier,
                        search: debouncedSearch || undefined,
                    },
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['supplierCatalog'],
                    onSuccess: (page: any) => {
                        const newCatalog = page.props.supplierCatalog;
                        setCatalog(newCatalog?.data || []);
                        setCatalogMeta(
                            newCatalog
                                ? {
                                      currentPage: newCatalog.current_page,
                                      lastPage: newCatalog.last_page,
                                      total: newCatalog.total,
                                  }
                                : null,
                        );
                        setLoadingCatalog(false);
                    },
                    onError: () => setLoadingCatalog(false),
                },
            );
        }
    }, [selectedSupplier, debouncedSearch]);

    const loadMoreCatalog = useCallback(() => {
        if (
            !catalogMeta ||
            loadingMore ||
            catalogMeta.currentPage >= catalogMeta.lastPage
        ) {
            return;
        }

        setLoadingMore(true);
        router.get(
            PurchaseOrderController.create.url({
                query: {
                    supplier: selectedSupplier,
                    search: debouncedSearch || undefined,
                    page: catalogMeta.currentPage + 1,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['supplierCatalog'],
                onSuccess: (page: any) => {
                    const newCatalog = page.props.supplierCatalog;
                    if (newCatalog?.data) {
                        setCatalog((prev) => [...prev, ...newCatalog.data]);
                        setCatalogMeta({
                            currentPage: newCatalog.current_page,
                            lastPage: newCatalog.last_page,
                            total: newCatalog.total,
                        });
                    }
                    setLoadingMore(false);
                },
                onError: () => setLoadingMore(false),
            },
        );
    }, [catalogMeta, loadingMore, selectedSupplier, debouncedSearch]);

    const calculateItemPrice = useCallback(
        (item: SupplierCatalogItem, quantity: number): number => {
            if (!item.pricing_tiers || item.pricing_tiers.length === 0) {
                return item.base_wholesale_price;
            }

            const applicableTier = item.pricing_tiers
                .filter((tier) => {
                    const meetsMin = quantity >= tier.min_quantity;
                    const meetsMax =
                        tier.max_quantity === null ||
                        quantity <= tier.max_quantity;
                    return meetsMin && meetsMax;
                })
                .sort((a, b) => b.min_quantity - a.min_quantity)[0];

            return applicableTier?.price || item.base_wholesale_price;
        },
        [],
    );

    const addToCart = useCallback(
        (catalogItem: SupplierCatalogItem) => {
            setCart((prevCart) => {
                const existingItem = prevCart.find(
                    (item) => item.catalog_item_id === catalogItem.id,
                );

                if (existingItem) {
                    const newQuantity =
                        existingItem.quantity + catalogItem.min_order_quantity;
                    const unit_price = calculateItemPrice(
                        catalogItem,
                        newQuantity,
                    );
                    return prevCart.map((item) =>
                        item.catalog_item_id === catalogItem.id
                            ? { ...item, quantity: newQuantity, unit_price }
                            : item,
                    );
                }

                const quantity = catalogItem.min_order_quantity;
                const unit_price = calculateItemPrice(catalogItem, quantity);

                return [
                    ...prevCart,
                    {
                        catalog_item_id: catalogItem.id,
                        catalog_item: catalogItem,
                        quantity,
                        unit_price,
                    },
                ];
            });
        },
        [calculateItemPrice],
    );

    const updateQuantity = useCallback(
        (catalogItemId: number, newQuantity: number) => {
            setCart((prevCart) =>
                prevCart.map((item) => {
                    if (item.catalog_item_id === catalogItemId) {
                        const unit_price = calculateItemPrice(
                            item.catalog_item,
                            newQuantity,
                        );
                        return { ...item, quantity: newQuantity, unit_price };
                    }
                    return item;
                }),
            );
        },
        [calculateItemPrice],
    );

    const removeFromCart = useCallback((catalogItemId: number) => {
        setCart((prevCart) =>
            prevCart.filter((item) => item.catalog_item_id !== catalogItemId),
        );
    }, []);

    const subtotal = useMemo(() => calculateSubtotal(cart), [cart]);

    const cartItemIds = useMemo(() => {
        return new Set(cart.map((item) => item.catalog_item_id));
    }, [cart]);

    const availableCatalog = useMemo(() => {
        return catalog.filter((item) => item.is_available);
    }, [catalog]);

    if (supplierConnections.length === 0) {
        return (
            <>
                <Head title="Create Purchase Order" />
                <div className="space-y-6">
                    <EmptyState
                        icon={<Building2 className="h-12 w-12" />}
                        title="No supplier connections"
                        description="You need to connect with suppliers before creating purchase orders"
                        action={
                            <Link href={'/supplier/connections'}>
                                <Button>View Suppliers</Button>
                            </Link>
                        }
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Create Purchase Order" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Create Purchase Order
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Order products from your connected suppliers
                    </p>
                </div>

                <Form
                    {...PurchaseOrderController.store.form()}
                    transform={(data) => ({
                        ...data,
                        items: cart.map((item) => ({
                            catalog_item_id: item.catalog_item_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                        })),
                    })}
                >
                    {({ errors, processing }) => (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <Card className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                        Order Details
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="shop_id">
                                                Receiving Shop
                                            </Label>
                                            <Select
                                                options={shops.map((shop) => ({
                                                    value: shop.id.toString(),
                                                    label: shop.name,
                                                }))}
                                                value={selectedShop}
                                                onChange={setSelectedShop}
                                            />
                                            <input
                                                type="hidden"
                                                name="shop_id"
                                                value={selectedShop}
                                            />
                                            {errors.shop_id && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.shop_id}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="supplier_tenant_id">
                                                Supplier
                                            </Label>
                                            <Select
                                                options={supplierConnections.map(
                                                    (conn) => ({
                                                        value: conn.supplier_tenant_id.toString(),
                                                        label:
                                                            conn.supplier_tenant
                                                                ?.name ||
                                                            'Unknown',
                                                    }),
                                                )}
                                                value={selectedSupplier}
                                                onChange={setSelectedSupplier}
                                                placeholder="Select a supplier..."
                                            />
                                            <input
                                                type="hidden"
                                                name="supplier_tenant_id"
                                                value={selectedSupplier}
                                            />
                                            {errors.supplier_tenant_id && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.supplier_tenant_id}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="expected_delivery_date">
                                                Expected Delivery Date
                                            </Label>
                                            <Input
                                                id="expected_delivery_date"
                                                name="expected_delivery_date"
                                                type="date"
                                                value={expectedDeliveryDate}
                                                onChange={(e) =>
                                                    setExpectedDeliveryDate(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.expected_delivery_date && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {
                                                        errors.expected_delivery_date
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="notes">Notes</Label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                rows={3}
                                                value={notes}
                                                onChange={(e) =>
                                                    setNotes(e.target.value)
                                                }
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                placeholder="Additional notes for the supplier..."
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {selectedSupplier && (
                                    <Card className="mt-6 p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Supplier Catalog
                                                {catalogMeta && (
                                                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                        ({catalogMeta.total}{' '}
                                                        items)
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        <div className="relative mb-4">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-10"
                                            />
                                        </div>

                                        {loadingCatalog ? (
                                            <div className="space-y-3">
                                                {[1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-lg border p-4 dark:border-gray-700"
                                                    >
                                                        <Skeleton className="mb-2 h-5 w-3/4" />
                                                        <Skeleton className="h-4 w-1/2" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : availableCatalog.length === 0 ? (
                                            <EmptyState
                                                icon={
                                                    <Package className="h-10 w-10" />
                                                }
                                                title={
                                                    searchQuery
                                                        ? 'No products found'
                                                        : 'No products available'
                                                }
                                                description={
                                                    searchQuery
                                                        ? 'Try adjusting your search terms'
                                                        : 'This supplier has no products in their catalog'
                                                }
                                            />
                                        ) : (
                                            <>
                                                <div className="space-y-3">
                                                    {availableCatalog.map(
                                                        (item) => (
                                                            <CatalogItem
                                                                key={item.id}
                                                                item={item}
                                                                isInCart={cartItemIds.has(
                                                                    item.id,
                                                                )}
                                                                onAddToCart={
                                                                    addToCart
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </div>

                                                {catalogMeta &&
                                                    catalogMeta.currentPage <
                                                        catalogMeta.lastPage && (
                                                        <div className="mt-4 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={
                                                                    loadMoreCatalog
                                                                }
                                                                disabled={
                                                                    loadingMore
                                                                }
                                                            >
                                                                {loadingMore ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Loading...
                                                                    </>
                                                                ) : (
                                                                    `Load More (${catalogMeta.total - availableCatalog.length} remaining)`
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                            </>
                                        )}
                                    </Card>
                                )}
                            </div>

                            <div>
                                <Card className="sticky top-6 p-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5 text-gray-400" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Order Summary
                                        </h3>
                                    </div>

                                    {cart.length === 0 ? (
                                        <EmptyState
                                            icon={
                                                <Package className="h-8 w-8" />
                                            }
                                            title="Cart is empty"
                                            description="Add products from the supplier catalog"
                                        />
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {cart.map((item) => (
                                                    <div
                                                        key={
                                                            item.catalog_item_id
                                                        }
                                                        className="rounded-lg border p-3 dark:border-gray-700"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {
                                                                        item
                                                                            .catalog_item
                                                                            .product
                                                                            ?.name
                                                                    }
                                                                </h4>
                                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatCurrency(item.unit_price, 'USD')}{' '}
                                                                    per unit
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    removeFromCart(
                                                                        item.catalog_item_id,
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        updateQuantity(
                                                                            item.catalog_item_id,
                                                                            Math.max(
                                                                                item
                                                                                    .catalog_item
                                                                                    .min_order_quantity,
                                                                                item.quantity -
                                                                                    1,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="rounded border p-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </button>
                                                                <span className="w-12 text-center text-sm font-medium">
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        updateQuantity(
                                                                            item.catalog_item_id,
                                                                            item.quantity +
                                                                                1,
                                                                        )
                                                                    }
                                                                    className="rounded border p-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                {formatCurrency(item.quantity * item.unit_price, 'USD')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 space-y-2 border-t pt-4 dark:border-gray-700">
                                                <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white">
                                                    <span>Subtotal</span>
                                                    <span>
                                                        {formatCurrency(subtotal, 'USD')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Tax and shipping calculated
                                                    by supplier
                                                </p>
                                            </div>

                                            <div className="mt-6 space-y-3">
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        cart.length === 0
                                                    }
                                                    className="w-full"
                                                >
                                                    Create Purchase Order
                                                </Button>
                                                {errors.items && (
                                                    <p className="text-sm text-red-600">
                                                        {errors.items}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
