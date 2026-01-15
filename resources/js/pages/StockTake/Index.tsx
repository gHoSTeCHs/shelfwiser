import StockTakeController from '@/actions/App/Http/Controllers/StockTakeController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import AppLayout from '@/layouts/AppLayout';
import { Shop } from '@/types/shop';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Save } from 'lucide-react';
import { useState } from 'react';

interface StockVariant {
    id: number;
    sku: string;
    name: string;
    product_name: string;
    system_count: number;
    physical_count: number | null;
    location_id: number | null;
}

interface Props {
    shop: Shop;
    variants: StockVariant[];
}

export default function Index({ shop, variants }: Props) {
    const { toast } = useToast();
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [notes, setNotes] = useState('');

    const handleCountChange = (variantId: number, value: string) => {
        const numValue = parseInt(value) || 0;
        setCounts((prev) => ({ ...prev, [variantId]: numValue }));
    };

    const calculateDifference = (variant: StockVariant): number => {
        const physicalCount = counts[variant.id] ?? variant.system_count;
        return physicalCount - variant.system_count;
    };

    const hasChanges = variants.some(
        (variant) => calculateDifference(variant) !== 0,
    );

    const prepareSubmitData = () => {
        return {
            counts: variants
                .filter((variant) => variant.location_id)
                .map((variant) => ({
                    variant_id: variant.id,
                    location_id: variant.location_id,
                    physical_count: counts[variant.id] ?? variant.system_count,
                    system_count: variant.system_count,
                })),
            notes,
        };
    };

    return (
        <AppLayout>
            <Head title={`Stock Take - ${shop.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/shops/${shop.id}`}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Shop
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Stock Take - {shop.name}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Conduct physical inventory count and reconcile with
                            system records
                        </p>
                    </div>
                </div>

                {variants.length === 0 ? (
                    <EmptyState
                        icon={<ClipboardList className="h-12 w-12" />}
                        title="No products found"
                        description="There are no active products in this shop to count."
                    />
                ) : (
                    <Form
                        action={StockTakeController.store.url({
                            shop: shop.id,
                        })}
                        method="post"
                        data={prepareSubmitData()}
                        onSuccess={() => {
                            toast.success('Stock take completed successfully');
                        }}
                        onError={() => {
                            toast.error('Failed to complete stock take');
                        }}
                    >
                        {({ processing }) => (
                            <div className="space-y-6">
                                <Card className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        SKU
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        Product
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        System Count
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        Physical Count
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        Difference
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                {variants.map((variant) => {
                                                    const difference =
                                                        calculateDifference(
                                                            variant,
                                                        );
                                                    return (
                                                        <tr
                                                            key={variant.id}
                                                            className={
                                                                difference !== 0
                                                                    ? 'bg-warning-50 dark:bg-warning-950/20'
                                                                    : ''
                                                            }
                                                        >
                                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                                                {variant.sku}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {
                                                                            variant.product_name
                                                                        }
                                                                    </div>
                                                                    {variant.name && (
                                                                        <div className="text-gray-500 dark:text-gray-400">
                                                                            {
                                                                                variant.name
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                                                {
                                                                    variant.system_count
                                                                }
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={
                                                                        counts[
                                                                            variant
                                                                                .id
                                                                        ]?.toString() ||
                                                                        variant.system_count.toString()
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleCountChange(
                                                                            variant.id,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="w-32 text-right"
                                                                />
                                                            </td>
                                                            <td
                                                                className={`px-6 py-4 text-right text-sm font-medium whitespace-nowrap ${
                                                                    difference >
                                                                    0
                                                                        ? 'text-success-600 dark:text-success-400'
                                                                        : difference <
                                                                            0
                                                                          ? 'text-error-600 dark:text-error-400'
                                                                          : 'text-gray-900 dark:text-white'
                                                                }`}
                                                            >
                                                                {difference > 0
                                                                    ? '+'
                                                                    : ''}
                                                                {difference}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Notes
                                            </label>
                                            <TextArea
                                                value={notes}
                                                onChange={(value) =>
                                                    setNotes(value)
                                                }
                                                placeholder="Add any notes about this stock take..."
                                                rows={3}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <Link href={`/shops/${shop.id}`}>
                                                <Button variant="outline">
                                                    Cancel
                                                </Button>
                                            </Link>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    processing || !hasChanges
                                                }
                                                loading={processing}
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                {hasChanges
                                                    ? 'Complete Stock Take'
                                                    : 'No Changes to Save'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </Form>
                )}
            </div>
        </AppLayout>
    );
}

Index.layout = (page: React.ReactNode) => page;
