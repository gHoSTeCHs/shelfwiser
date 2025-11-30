import OrderReturnController from '@/actions/App/Http/Controllers/OrderReturnController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Order } from '@/types/order';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, PackageX } from 'lucide-react';
import { useState } from 'react';

interface Props {
    order: Order;
}

interface ReturnItem {
    order_item_id: number;
    quantity: number;
    reason: string;
    condition_notes: string;
}

export default function Create({ order }: Props) {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [returnItems, setReturnItems] = useState<
        Record<number, ReturnItem>
    >({});

    const handleQuantityChange = (orderItemId: number, quantity: string) => {
        const numValue = parseInt(quantity) || 0;
        setReturnItems((prev) => ({
            ...prev,
            [orderItemId]: {
                ...prev[orderItemId],
                order_item_id: orderItemId,
                quantity: numValue,
                reason: prev[orderItemId]?.reason || '',
                condition_notes: prev[orderItemId]?.condition_notes || '',
            },
        }));
    };

    const handleItemReasonChange = (orderItemId: number, reason: string) => {
        setReturnItems((prev) => ({
            ...prev,
            [orderItemId]: {
                ...prev[orderItemId],
                order_item_id: orderItemId,
                quantity: prev[orderItemId]?.quantity || 0,
                reason,
                condition_notes: prev[orderItemId]?.condition_notes || '',
            },
        }));
    };

    const handleConditionNotesChange = (
        orderItemId: number,
        notes: string
    ) => {
        setReturnItems((prev) => ({
            ...prev,
            [orderItemId]: {
                ...prev[orderItemId],
                order_item_id: orderItemId,
                quantity: prev[orderItemId]?.quantity || 0,
                reason: prev[orderItemId]?.reason || '',
                condition_notes: notes,
            },
        }));
    };

    const prepareSubmitData = () => {
        const items = Object.values(returnItems).filter(
            (item) => item.quantity > 0
        );

        return {
            reason,
            notes,
            items,
        };
    };

    const hasSelectedItems = Object.values(returnItems).some(
        (item) => item.quantity > 0
    );

    return (
        <AppLayout>
            <Head title={`Process Return - Order ${order.order_number}`} />

            <div className="space-y-6">
                <div>
                    <Link
                        href={`/orders/${order.id}`}
                        className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Order
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Process Return - Order {order.order_number}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Select items to return and provide return details
                    </p>
                </div>

                <Form
                    action={OrderReturnController.store.url({ order: order.id })}
                    method="post"
                    data={prepareSubmitData()}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            {/* Order Items */}
                            <Card title="Select Items to Return">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b border-gray-200 dark:border-gray-700">
                                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                                                <th className="pb-3 font-medium">
                                                    Product
                                                </th>
                                                <th className="pb-3 font-medium">
                                                    SKU
                                                </th>
                                                <th className="pb-3 text-right font-medium">
                                                    Ordered Qty
                                                </th>
                                                <th className="pb-3 text-right font-medium">
                                                    Return Qty
                                                </th>
                                                <th className="pb-3 font-medium">
                                                    Reason
                                                </th>
                                                <th className="pb-3 font-medium">
                                                    Condition
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {order.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="py-3">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {
                                                                    item
                                                                        .product_variant
                                                                        ?.product
                                                                        ?.name
                                                                }
                                                            </p>
                                                            {item.product_variant
                                                                ?.name && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {
                                                                        item
                                                                            .product_variant
                                                                            .name
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">
                                                        {
                                                            item.product_variant
                                                                ?.sku
                                                        }
                                                    </td>
                                                    <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            value={
                                                                returnItems[
                                                                    item.id
                                                                ]?.quantity?.toString() ||
                                                                '0'
                                                            }
                                                            onChange={(e) =>
                                                                handleQuantityChange(
                                                                    item.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="w-24 text-right"
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <Input
                                                            type="text"
                                                            placeholder="Defective, wrong item, etc."
                                                            value={
                                                                returnItems[
                                                                    item.id
                                                                ]?.reason || ''
                                                            }
                                                            onChange={(e) =>
                                                                handleItemReasonChange(
                                                                    item.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                !returnItems[
                                                                    item.id
                                                                ]?.quantity ||
                                                                returnItems[
                                                                    item.id
                                                                ]?.quantity <= 0
                                                            }
                                                            className="min-w-[200px]"
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <Input
                                                            type="text"
                                                            placeholder="Item condition notes"
                                                            value={
                                                                returnItems[
                                                                    item.id
                                                                ]
                                                                    ?.condition_notes ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                handleConditionNotesChange(
                                                                    item.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                !returnItems[
                                                                    item.id
                                                                ]?.quantity ||
                                                                returnItems[
                                                                    item.id
                                                                ]?.quantity <= 0
                                                            }
                                                            className="min-w-[200px]"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <InputError message={errors.items} />
                            </Card>

                            {/* Return Details */}
                            <Card title="Return Details">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="reason">
                                            Overall Return Reason{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <TextArea
                                            id="reason"
                                            value={reason}
                                            onChange={(value) =>
                                                setReason(value)
                                            }
                                            placeholder="Describe the reason for this return..."
                                            rows={3}
                                            error={!!errors.reason}
                                        />
                                        <InputError message={errors.reason} />
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">
                                            Additional Notes
                                        </Label>
                                        <TextArea
                                            id="notes"
                                            value={notes}
                                            onChange={(value) =>
                                                setNotes(value)
                                            }
                                            placeholder="Any additional information..."
                                            rows={3}
                                        />
                                        <InputError message={errors.notes} />
                                    </div>
                                </div>
                            </Card>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Link href={`/orders/${order.id}`}>
                                    <Button variant="outline">Cancel</Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !hasSelectedItems ||
                                        !reason
                                    }
                                    loading={processing}
                                >
                                    <PackageX className="mr-2 h-4 w-4" />
                                    Submit Return Request
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}

Create.layout = (page: React.ReactNode) => page;
