import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Product } from '@/types/product';
import { CatalogVisibility } from '@/types/supplier';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, DollarSign, Save } from 'lucide-react';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import { FormEventHandler, useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
    products: Product[];
}

interface PricingTier {
    min_quantity: number;
    max_quantity: number | null;
    price: number;
}

const visibilityOptions: { value: CatalogVisibility; label: string }[] = [
    { value: 'connections_only', label: 'Connections Only (Approved buyers)' },
    { value: 'public', label: 'Public (Visible to all)' },
    { value: 'private', label: 'Private (Not visible)' },
];

export default function Create({ products }: Props) {
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        product_id: '',
        is_available: true,
        base_wholesale_price: '',
        min_order_quantity: '1',
        visibility: 'connections_only' as CatalogVisibility,
        description: '',
        pricing_tiers: [] as PricingTier[],
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('supplier.catalog.store'));
    };

    const addPricingTier = () => {
        const newTier: PricingTier = {
            min_quantity: pricingTiers.length > 0 ? (pricingTiers[pricingTiers.length - 1].max_quantity || 0) + 1 : 1,
            max_quantity: null,
            price: parseFloat(data.base_wholesale_price) || 0,
        };
        const updated = [...pricingTiers, newTier];
        setPricingTiers(updated);
        setData('pricing_tiers', updated);
    };

    const removePricingTier = (index: number) => {
        const updated = pricingTiers.filter((_, i) => i !== index);
        setPricingTiers(updated);
        setData('pricing_tiers', updated);
    };

    const updatePricingTier = (index: number, field: keyof PricingTier, value: number | null) => {
        const updated = [...pricingTiers];
        updated[index] = { ...updated[index], [field]: value };
        setPricingTiers(updated);
        setData('pricing_tiers', updated);
    };

    if (products.length === 0) {
        return (
            <AppLayout>
                <Head title="Add Product to Catalog" />
                <div className="space-y-6">
                    <EmptyState
                        icon={<DollarSign className="h-12 w-12" />}
                        title="No products available"
                        description="You need to create products first before adding them to your supplier catalog"
                        action={
                            <Button onClick={() => window.history.back()}>
                                Go Back
                            </Button>
                        }
                    />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Add Product to Catalog" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Add Product to Catalog
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Make your product available to buyers with custom pricing
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Product Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="product_id" required>
                                    Select Product
                                </Label>
                                <Select
                                    options={products.map((p) => ({
                                        value: p.id.toString(),
                                        label: `${p.name} (${p.slug})`,
                                    }))}
                                    value={data.product_id}
                                    onChange={(value) => setData('product_id', value)}
                                    placeholder="Choose a product..."
                                />
                                {errors.product_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="base_wholesale_price" required>
                                    Base Wholesale Price
                                </Label>
                                <Input
                                    id="base_wholesale_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.base_wholesale_price}
                                    onChange={(e) => setData('base_wholesale_price', e.target.value)}
                                    error={errors.base_wholesale_price}
                                    required
                                    placeholder="0.00"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Default price for all buyers (before volume discounts)
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="min_order_quantity">
                                    Minimum Order Quantity
                                </Label>
                                <Input
                                    id="min_order_quantity"
                                    type="number"
                                    min="1"
                                    value={data.min_order_quantity}
                                    onChange={(e) => setData('min_order_quantity', e.target.value)}
                                    error={errors.min_order_quantity}
                                />
                            </div>

                            <div>
                                <Label htmlFor="visibility" required>
                                    Visibility
                                </Label>
                                <Select
                                    options={visibilityOptions}
                                    value={data.visibility}
                                    onChange={(value) => setData('visibility', value as CatalogVisibility)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Additional information for buyers..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="is_available"
                                    type="checkbox"
                                    checked={data.is_available}
                                    onChange={(e) => setData('is_available', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="is_available" className="mb-0">
                                    Available for purchase
                                </Label>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Volume Pricing (Optional)
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Offer discounts for bulk orders
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Tier
                            </Button>
                        </div>

                        {pricingTiers.length > 0 ? (
                            <div className="space-y-3">
                                {pricingTiers.map((tier, index) => (
                                    <div
                                        key={index}
                                        className="flex items-end gap-3 rounded-lg border p-4 dark:border-gray-700"
                                    >
                                        <div className="flex-1">
                                            <Label htmlFor={`tier-${index}-min`}>Min Qty</Label>
                                            <Input
                                                id={`tier-${index}-min`}
                                                type="number"
                                                min="1"
                                                value={tier.min_quantity}
                                                onChange={(e) =>
                                                    updatePricingTier(index, 'min_quantity', parseInt(e.target.value))
                                                }
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor={`tier-${index}-max`}>Max Qty</Label>
                                            <Input
                                                id={`tier-${index}-max`}
                                                type="number"
                                                min={tier.min_quantity}
                                                value={tier.max_quantity?.toString() || ''}
                                                onChange={(e) =>
                                                    updatePricingTier(
                                                        index,
                                                        'max_quantity',
                                                        e.target.value ? parseInt(e.target.value) : null
                                                    )
                                                }
                                                placeholder="Unlimited"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor={`tier-${index}-price`}>Price</Label>
                                            <Input
                                                id={`tier-${index}-price`}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={tier.price}
                                                onChange={(e) =>
                                                    updatePricingTier(index, 'price', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePricingTier(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                No volume pricing tiers defined. Buyers will pay the base wholesale price.
                            </p>
                        )}
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Add to Catalog
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
