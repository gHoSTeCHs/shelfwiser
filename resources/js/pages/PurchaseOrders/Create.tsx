import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { Shop } from '@/types/shop';
import { SupplierCatalogItem, SupplierConnection } from '@/types/supplier';
import { Form, Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Minus,
    Package,
    Plus,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    shops: Shop[];
    supplierConnections: SupplierConnection[];
    supplierCatalog?: SupplierCatalogItem[];
    selectedSupplierId?: number;
}

interface CartItem {
    catalog_item_id: number;
    catalog_item: SupplierCatalogItem;
    quantity: number;
    unit_price: number;
}

export default function Create({
    shops,
    supplierConnections,
    supplierCatalog = [],
    selectedSupplierId,
}: Props) {
    const [selectedShop, setSelectedShop] = useState<string>(
        shops[0]?.id.toString() || '',
    );
    const [selectedSupplier, setSelectedSupplier] = useState<string>(
        selectedSupplierId?.toString() || '',
    );
    const [catalog, setCatalog] =
        useState<SupplierCatalogItem[]>(supplierCatalog);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (selectedSupplier) {
            setLoadingCatalog(true);
            router.get(
                PurchaseOrderController.create.url({
                    query: { supplier: selectedSupplier },
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['supplierCatalog'],
                    onSuccess: (page: any) => {
                        setCatalog(page.props.supplierCatalog || []);
                        setLoadingCatalog(false);
                    },
                    onError: () => setLoadingCatalog(false),
                },
            );
        }
    }, [selectedSupplier]);

    const calculateItemPrice = (
        item: SupplierCatalogItem,
        quantity: number,
    ): number => {
        if (!item.pricing_tiers || item.pricing_tiers.length === 0) {
            return item.base_wholesale_price;
        }

        const applicableTier = item.pricing_tiers
            .filter((tier) => {
                const meetsMin = quantity >= tier.min_quantity;
                const meetsMax =
                    tier.max_quantity === null || quantity <= tier.max_quantity;
                return meetsMin && meetsMax;
            })
            .sort((a, b) => b.min_quantity - a.min_quantity)[0];

        return applicableTier?.price || item.base_wholesale_price;
    };

    const addToCart = (catalogItem: SupplierCatalogItem) => {
        const existingItem = cart.find(
            (item) => item.catalog_item_id === catalogItem.id,
        );

        if (existingItem) {
            updateQuantity(
                catalogItem.id,
                existingItem.quantity + catalogItem.min_order_quantity,
            );
        } else {
            const quantity = catalogItem.min_order_quantity;
            const unit_price = calculateItemPrice(catalogItem, quantity);

            setCart([
                ...cart,
                {
                    catalog_item_id: catalogItem.id,
                    catalog_item: catalogItem,
                    quantity,
                    unit_price,
                },
            ]);
        }
    };

    const updateQuantity = (catalogItemId: number, newQuantity: number) => {
        const updatedCart = cart.map((item) => {
            if (item.catalog_item_id === catalogItemId) {
                const unit_price = calculateItemPrice(
                    item.catalog_item,
                    newQuantity,
                );
                return { ...item, quantity: newQuantity, unit_price };
            }
            return item;
        });
        setCart(updatedCart);
    };

    const removeFromCart = (catalogItemId: number) => {
        setCart(cart.filter((item) => item.catalog_item_id !== catalogItemId));
    };

    const calculateSubtotal = (): number => {
        return cart.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
        );
    };

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
                                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                            Supplier Catalog
                                        </h3>

                                        {loadingCatalog ? (
                                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                                Loading catalog...
                                            </p>
                                        ) : catalog.length === 0 ? (
                                            <EmptyState
                                                icon={
                                                    <Package className="h-10 w-10" />
                                                }
                                                title="No products available"
                                                description="This supplier has no products in their catalog"
                                            />
                                        ) : (
                                            <div className="space-y-3">
                                                {catalog
                                                    .filter(
                                                        (item) =>
                                                            item.is_available,
                                                    )
                                                    .map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                                        {
                                                                            item
                                                                                .product
                                                                                ?.name
                                                                        }
                                                                    </h4>
                                                                    {item.pricing_tiers &&
                                                                        item
                                                                            .pricing_tiers
                                                                            .length >
                                                                            0 && (
                                                                            <Badge
                                                                                variant="light"
                                                                                color="primary"
                                                                                size="sm"
                                                                            >
                                                                                Volume
                                                                                Pricing
                                                                            </Badge>
                                                                        )}
                                                                </div>
                                                                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    <span>
                                                                        Base: $
                                                                        {item.base_wholesale_price.toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                    <span>
                                                                        Min.
                                                                        Order:{' '}
                                                                        {
                                                                            item.min_order_quantity
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {item.description && (
                                                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                        {
                                                                            item.description
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    addToCart(
                                                                        item,
                                                                    )
                                                                }
                                                                disabled={cart.some(
                                                                    (
                                                                        cartItem,
                                                                    ) =>
                                                                        cartItem.catalog_item_id ===
                                                                        item.id,
                                                                )}
                                                            >
                                                                <Plus className="mr-1 h-4 w-4" />
                                                                {cart.some(
                                                                    (
                                                                        cartItem,
                                                                    ) =>
                                                                        cartItem.catalog_item_id ===
                                                                        item.id,
                                                                )
                                                                    ? 'Added'
                                                                    : 'Add'}
                                                            </Button>
                                                        </div>
                                                    ))}
                                            </div>
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
                                                                    $
                                                                    {item.unit_price.toFixed(
                                                                        2,
                                                                    )}{' '}
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
                                                                $
                                                                {(
                                                                    item.quantity *
                                                                    item.unit_price
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 space-y-2 border-t pt-4 dark:border-gray-700">
                                                <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white">
                                                    <span>Subtotal</span>
                                                    <span>
                                                        $
                                                        {calculateSubtotal().toFixed(
                                                            2,
                                                        )}
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
