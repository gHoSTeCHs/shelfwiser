import OrderController from '@/actions/App/Http/Controllers/OrderController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Shop } from '@/types/shop';
import { ProductVariant } from '@/types/stockMovement';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface OrderItemForm {
    id: string;
    product_variant_id: number | '';
    quantity: number;
    unit_price: number;
}

interface Props {
    shops: Shop[];
    products: ProductVariant[];
}

export default function Create({ shops, products }: Props) {
    const [shopId, setShopId] = useState<number | ''>('');
    const [customerNotes, setCustomerNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingAddress, setShippingAddress] = useState('');
    const [billingAddress, setBillingAddress] = useState('');

    const [items, setItems] = useState<OrderItemForm[]>([
        {
            id: crypto.randomUUID(),
            product_variant_id: '',
            quantity: 1,
            unit_price: 0,
        },
    ]);

    const addItem = () => {
        setItems([
            ...items,
            {
                id: crypto.randomUUID(),
                product_variant_id: '',
                quantity: 1,
                unit_price: 0,
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof OrderItemForm, value: any) => {
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };

                    if (field === 'product_variant_id' && value) {
                        const variant = products.find(
                            (p) => p.id === parseInt(value),
                        );
                        if (variant && updated.unit_price === 0) {
                            updated.unit_price = variant.price;
                        }
                    }

                    return updated;
                }
                return item;
            }),
        );
    };

    const getFilteredProducts = (itemId: string) => {
        const selectedIds = items
            .filter((i) => i.id !== itemId && i.product_variant_id)
            .map((i) => i.product_variant_id);

        return products.filter((p) => !selectedIds.includes(p.id));
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => {
            return sum + item.quantity * item.unit_price;
        }, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + shippingCost;
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const getProductLabel = (product: ProductVariant): string => {
        const productName = product.product?.name || 'Unknown';
        const variantName = product.name ? ` - ${product.name}` : '';
        const sku = ` (${product.sku})`;
        return `${productName}${variantName}${sku}`;
    };

    const getAvailableStock = (variant: ProductVariant): number => {
        return (
            variant.inventory_locations?.reduce(
                (sum, loc) => sum + (loc.quantity - loc.reserved_quantity),
                0,
            ) || 0
        );
    };

    return (
        <AppLayout>
            <Head title="Create Order" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={'/orders'}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create New Order
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Create a new sales order
                        </p>
                    </div>
                </div>

                <Form
                    action={OrderController.store.url()}
                    method="post"
                    className="space-y-6"
                    transform={(data) => ({
                        ...data,
                        items: items.map((item) => ({
                            product_variant_id: item.product_variant_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                        })),
                    })}
                >
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card title="Order Details">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="shop_id">
                                            Shop{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={shops.map((shop) => ({
                                                value: shop.id.toString(),
                                                label: shop.name,
                                            }))}
                                            placeholder="Select shop"
                                            onChange={(value) =>
                                                setShopId(parseInt(value))
                                            }
                                            defaultValue=""
                                        />
                                        <InputError message={undefined} />
                                        <input
                                            type="hidden"
                                            name="shop_id"
                                            value={shopId}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card title="Order Items">
                                <div className="space-y-4">
                                    {items.map((item, index) => {
                                        const availableProducts =
                                            getFilteredProducts(item.id);
                                        const selectedVariant = products.find(
                                            (p) =>
                                                p.id ===
                                                item.product_variant_id,
                                        );
                                        const availableStock = selectedVariant
                                            ? getAvailableStock(selectedVariant)
                                            : 0;

                                        return (
                                            <div
                                                key={item.id}
                                                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        Item {index + 1}
                                                    </h4>
                                                    {items.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="text-error-600 hover:text-error-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-3">
                                                    <div className="md:col-span-2">
                                                        <Label>
                                                            Product{' '}
                                                            <span className="text-error-500">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Select
                                                            options={availableProducts.map(
                                                                (p) => ({
                                                                    value: p.id.toString(),
                                                                    label: getProductLabel(
                                                                        p,
                                                                    ),
                                                                }),
                                                            )}
                                                            placeholder="Select product"
                                                            onChange={(value) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'product_variant_id',
                                                                    parseInt(
                                                                        value,
                                                                    ),
                                                                )
                                                            }
                                                            defaultValue=""
                                                        />
                                                        {selectedVariant && (
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                Available:{' '}
                                                                {availableStock}{' '}
                                                                units
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <Label>
                                                            Quantity{' '}
                                                            <span className="text-error-500">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'quantity',
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>
                                                            Unit Price{' '}
                                                            <span className="text-error-500">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                item.unit_price
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    item.id,
                                                                    'unit_price',
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <Label>
                                                            Item Total
                                                        </Label>
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {formatCurrency(
                                                                item.quantity *
                                                                    item.unit_price,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addItem}
                                        className="w-full"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </div>
                            </Card>

                            <Card title="Additional Information">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="customer_notes">
                                            Customer Notes
                                        </Label>
                                        <TextArea
                                            id="customer_notes"
                                            value={customerNotes}
                                            onChange={(value) =>
                                                setCustomerNotes(value)
                                            }
                                            placeholder="Notes visible to customer"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="internal_notes">
                                            Internal Notes
                                        </Label>
                                        <TextArea
                                            id="internal_notes"
                                            value={internalNotes}
                                            onChange={(value) =>
                                                setInternalNotes(value)
                                            }
                                            placeholder="Internal notes (not visible to customer)"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="shipping_address">
                                            Shipping Address
                                        </Label>
                                        <TextArea
                                            id="shipping_address"
                                            value={shippingAddress}
                                            onChange={(value) =>
                                                setShippingAddress(value)
                                            }
                                            placeholder="Enter shipping address"
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="billing_address">
                                            Billing Address
                                        </Label>
                                        <TextArea
                                            id="billing_address"
                                            value={billingAddress}
                                            onChange={(value) =>
                                                setBillingAddress(value)
                                            }
                                            placeholder="Enter billing address"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card title="Order Summary">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Subtotal
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                calculateSubtotal(),
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <Label htmlFor="shipping_cost">
                                            Shipping Cost
                                        </Label>
                                        <Input
                                            type="number"
                                            id="shipping_cost"
                                            name="shipping_cost"
                                            min="0"
                                            step="0.01"
                                            value={shippingCost}
                                            onChange={(e) =>
                                                setShippingCost(
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Total
                                            </span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    calculateTotal(),
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Button type="submit" className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                Create Order
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>
        </AppLayout>
    );
}
