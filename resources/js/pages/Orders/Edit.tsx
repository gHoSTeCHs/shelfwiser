import OrderController from '@/actions/App/Http/Controllers/OrderController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import PackagingSelector from '@/components/inventory/PackagingSelector';
import AppLayout from '@/layouts/AppLayout';
import { Shop } from '@/types/shop';
import { Order, OrderItem } from '@/types/order';
import { ProductVariant } from '@/types/stockMovement';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface OrderItemForm {
    id: string | number;
    product_variant_id: number | '';
    product_packaging_type_id: number | null;
    package_quantity: number;
    quantity: number;
    unit_price: number;
}

interface Props {
    order: Order & { items: OrderItem[] };
    shops: Shop[];
    products: ProductVariant[];
}

export default function Edit({ order, shops, products }: Props) {
    const toast = useToast();
    const [customerNotes, setCustomerNotes] = useState(
        order.customer_notes || '',
    );
    const [internalNotes, setInternalNotes] = useState(
        order.internal_notes || '',
    );
    const [shippingCost, setShippingCost] = useState(order.shipping_cost);
    const [shippingAddress, setShippingAddress] = useState(
        order.shipping_address || '',
    );
    const [billingAddress, setBillingAddress] = useState(
        order.billing_address || '',
    );

    const [items, setItems] = useState<OrderItemForm[]>(
        order.items.map((item) => ({
            id: item.id,
            product_variant_id: item.product_variant_id,
            product_packaging_type_id: item.product_packaging_type_id,
            package_quantity: item.package_quantity || 1,
            quantity: item.quantity,
            unit_price: item.unit_price,
        })),
    );

    const canEdit = order.status === 'pending' || order.status === 'confirmed';

    const addItem = () => {
        setItems([
            ...items,
            {
                id: crypto.randomUUID(),
                product_variant_id: '',
                product_packaging_type_id: null,
                package_quantity: 1,
                quantity: 1,
                unit_price: 0,
            },
        ]);
    };

    const removeItem = (id: string | number) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (
        id: string | number,
        field: keyof OrderItemForm,
        value: any,
    ) => {
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };

                    if (field === 'product_variant_id' && value) {
                        const variant = products.find(
                            (p) => p.id === parseInt(value),
                        );
                        if (variant) {
                            updated.product_packaging_type_id = null;
                            updated.package_quantity = 1;
                            updated.quantity = 1;
                            if (updated.unit_price === 0) {
                                updated.unit_price = variant.price;
                            }
                        }
                    }

                    if (field === 'product_packaging_type_id' && value) {
                        const variant = products.find(
                            (p) => p.id === item.product_variant_id,
                        );
                        if (variant) {
                            const packagingType = variant.packaging_types?.find(
                                (pt) => pt.id === value,
                            );
                            if (packagingType && packagingType.price) {
                                updated.unit_price = packagingType.price;
                            }
                        }
                    }

                    return updated;
                }
                return item;
            }),
        );
    };

    const calculateItemTotal = (item: OrderItemForm): number => {
        const variant = products.find((p) => p.id === item.product_variant_id);
        if (!variant) return 0;

        let baseQuantity = item.quantity;

        if (item.product_packaging_type_id) {
            const packagingType = variant.packaging_types?.find(
                (pt) => pt.id === item.product_packaging_type_id,
            );
            if (packagingType) {
                baseQuantity =
                    item.package_quantity *
                    packagingType.units_per_package *
                    item.quantity;
            }
        }

        return baseQuantity * item.unit_price;
    };

    const subtotal = items.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0,
    );
    const total = subtotal + shippingCost;

    return (
        <AppLayout>
            <Head title={`Edit Order #${order.order_number}`} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={OrderController.show.url({ order: order.id })}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Order
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Edit Order #{order.order_number}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {canEdit
                                    ? 'Update order details and items'
                                    : 'Order can only be edited in pending or confirmed status'}
                            </p>
                        </div>
                    </div>
                </div>

                {!canEdit && (
                    <Card className="mb-6 border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/50">
                        <div className="p-4">
                            <p className="text-sm text-warning-800 dark:text-warning-200">
                                This order cannot be edited because it is in{' '}
                                <span className="font-semibold">
                                    {order.status}
                                </span>{' '}
                                status. Only pending or confirmed orders can be
                                modified.
                            </p>
                        </div>
                    </Card>
                )}

                <Form
                    action={OrderController.update.url({ order: order.id })}
                    method="put"
                    onSuccess={() => {
                        toast.success('Order updated successfully');
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="space-y-6">
                                <Card title="Order Items">
                                    <div className="space-y-4">
                                        {items.map((item, index) => {
                                            const variant = products.find(
                                                (p) =>
                                                    p.id ===
                                                    item.product_variant_id,
                                            );
                                            const itemTotal =
                                                calculateItemTotal(item);

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                                >
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Item #{index + 1}
                                                        </h4>
                                                        {items.length > 1 && canEdit && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeItem(
                                                                        item.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div>
                                                            <Label
                                                                htmlFor={`items.${index}.product_variant_id`}
                                                            >
                                                                Product{' '}
                                                                <span className="text-error-500">
                                                                    *
                                                                </span>
                                                            </Label>
                                                            <Select
                                                                options={[
                                                                    {
                                                                        value: '',
                                                                        label: 'Select product',
                                                                    },
                                                                    ...products.map(
                                                                        (p) => ({
                                                                            value: p.id.toString(),
                                                                            label: `${p.product?.name} - ${p.name} (${p.sku})`,
                                                                        }),
                                                                    ),
                                                                ]}
                                                                value={
                                                                    item.product_variant_id?.toString() ||
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'product_variant_id',
                                                                        value,
                                                                    )
                                                                }
                                                                disabled={!canEdit}
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`items[${index}][product_variant_id]`}
                                                                value={
                                                                    item.product_variant_id
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `items.${index}.product_variant_id`
                                                                    ]
                                                                }
                                                            />
                                                        </div>

                                                        {variant &&
                                                            variant.packaging_types &&
                                                            variant
                                                                .packaging_types
                                                                .length > 0 && (
                                                                <div>
                                                                    <PackagingSelector
                                                                        packagingTypes={
                                                                            variant.packaging_types
                                                                        }
                                                                        selectedPackagingTypeId={
                                                                            item.product_packaging_type_id
                                                                        }
                                                                        packageQuantity={
                                                                            item.package_quantity
                                                                        }
                                                                        onPackagingChange={(
                                                                            id,
                                                                        ) =>
                                                                            updateItem(
                                                                                item.id,
                                                                                'product_packaging_type_id',
                                                                                id,
                                                                            )
                                                                        }
                                                                        onQuantityChange={(
                                                                            qty,
                                                                        ) =>
                                                                            updateItem(
                                                                                item.id,
                                                                                'package_quantity',
                                                                                qty,
                                                                            )
                                                                        }
                                                                        disabled={!canEdit}
                                                                    />
                                                                    <input
                                                                        type="hidden"
                                                                        name={`items[${index}][product_packaging_type_id]`}
                                                                        value={
                                                                            item.product_packaging_type_id ||
                                                                            ''
                                                                        }
                                                                    />
                                                                    <input
                                                                        type="hidden"
                                                                        name={`items[${index}][package_quantity]`}
                                                                        value={
                                                                            item.package_quantity
                                                                        }
                                                                    />
                                                                </div>
                                                            )}

                                                        <div>
                                                            <Label
                                                                htmlFor={`items.${index}.quantity`}
                                                            >
                                                                Quantity{' '}
                                                                <span className="text-error-500">
                                                                    *
                                                                </span>
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                name={`items[${index}][quantity]`}
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'quantity',
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 1,
                                                                    )
                                                                }
                                                                min={1}
                                                                disabled={!canEdit}
                                                                error={
                                                                    !!errors[
                                                                        `items.${index}.quantity`
                                                                    ]
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `items.${index}.quantity`
                                                                    ]
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label
                                                                htmlFor={`items.${index}.unit_price`}
                                                            >
                                                                Unit Price ($)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                name={`items[${index}][unit_price]`}
                                                                value={
                                                                    item.unit_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        'unit_price',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                                step="0.01"
                                                                min={0}
                                                                disabled={!canEdit}
                                                                error={
                                                                    !!errors[
                                                                        `items.${index}.unit_price`
                                                                    ]
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `items.${index}.unit_price`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            Item Total: $
                                                            {itemTotal.toFixed(
                                                                2,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {canEdit && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addItem}
                                                className="w-full"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Another Item
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    <Card title="Shipping & Billing">
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="shipping_cost">
                                                    Shipping Cost ($)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    name="shipping_cost"
                                                    value={shippingCost}
                                                    onChange={(e) =>
                                                        setShippingCost(
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                    step="0.01"
                                                    min={0}
                                                    disabled={!canEdit}
                                                    error={
                                                        !!errors.shipping_cost
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.shipping_cost
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="shipping_address">
                                                    Shipping Address
                                                </Label>
                                                <TextArea
                                                    name="shipping_address"
                                                    value={shippingAddress}
                                                    onChange={
                                                        setShippingAddress
                                                    }
                                                    rows={3}
                                                    disabled={!canEdit}
                                                    error={
                                                        !!errors.shipping_address
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.shipping_address
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="billing_address">
                                                    Billing Address
                                                </Label>
                                                <TextArea
                                                    name="billing_address"
                                                    value={billingAddress}
                                                    onChange={setBillingAddress}
                                                    rows={3}
                                                    disabled={!canEdit}
                                                    error={
                                                        !!errors.billing_address
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.billing_address
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card title="Notes & Summary">
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="customer_notes">
                                                    Customer Notes
                                                </Label>
                                                <TextArea
                                                    name="customer_notes"
                                                    value={customerNotes}
                                                    onChange={setCustomerNotes}
                                                    rows={2}
                                                    disabled={!canEdit}
                                                    error={
                                                        !!errors.customer_notes
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.customer_notes
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="internal_notes">
                                                    Internal Notes
                                                </Label>
                                                <TextArea
                                                    name="internal_notes"
                                                    value={internalNotes}
                                                    onChange={setInternalNotes}
                                                    rows={2}
                                                    disabled={!canEdit}
                                                    error={
                                                        !!errors.internal_notes
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.internal_notes
                                                    }
                                                />
                                            </div>

                                            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            Subtotal
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            $
                                                            {subtotal.toFixed(
                                                                2,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            Shipping
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            $
                                                            {shippingCost.toFixed(
                                                                2,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                                                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                                                            Total
                                                        </span>
                                                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                                                            ${total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Link
                                        href={OrderController.show.url({
                                            order: order.id,
                                        })}
                                    >
                                        <Button variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing || !canEdit}
                                        loading={processing}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Order
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}

Edit.layout = (page: React.ReactNode) => page;
