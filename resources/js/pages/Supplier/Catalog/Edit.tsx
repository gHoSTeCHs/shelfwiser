import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { SupplierCatalogItem, CatalogVisibility } from '@/types/supplier';
import { Form, Head, Link } from '@inertiajs/react';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import { useState } from 'react';

interface Props {
    catalogItem: SupplierCatalogItem;
}

interface PricingTier {
    id?: number;
    min_quantity: number;
    max_quantity: number | null;
    price: number;
}

const visibilityOptions: { value: CatalogVisibility; label: string }[] = [
    { value: 'connections_only', label: 'Connections Only (Approved buyers)' },
    { value: 'public', label: 'Public (Visible to all)' },
    { value: 'private', label: 'Private (Not visible)' },
];

export default function Edit({ catalogItem }: Props) {
    const [isAvailable, setIsAvailable] = useState<boolean>(catalogItem.is_available);
    const [baseWholesalePrice, setBaseWholesalePrice] = useState<string>(
        catalogItem.base_wholesale_price.toString()
    );
    const [minOrderQuantity, setMinOrderQuantity] = useState<string>(
        catalogItem.min_order_quantity.toString()
    );
    const [visibility, setVisibility] = useState<CatalogVisibility>(catalogItem.visibility);
    const [description, setDescription] = useState<string>(catalogItem.description || '');
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
        catalogItem.pricing_tiers || []
    );

    const addPricingTier = () => {
        const newTier: PricingTier = {
            min_quantity:
                pricingTiers.length > 0
                    ? (pricingTiers[pricingTiers.length - 1].max_quantity || 0) + 1
                    : 1,
            max_quantity: null,
            price: parseFloat(baseWholesalePrice) || 0,
        };
        setPricingTiers([...pricingTiers, newTier]);
    };

    const removePricingTier = (index: number) => {
        setPricingTiers(pricingTiers.filter((_, i) => i !== index));
    };

    const updatePricingTier = (
        index: number,
        field: keyof PricingTier,
        value: number | null
    ) => {
        const updated = [...pricingTiers];
        updated[index] = { ...updated[index], [field]: value };
        setPricingTiers(updated);
    };

    return (
        <AppLayout>
            <Head title={`Edit ${catalogItem.product?.name} in Catalog`} />

            <div className="space-y-6">
                <div>
                    <Link
                        href={route('supplier.catalog.index')}
                        className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Catalog
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Edit Catalog Item
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Update pricing and availability for {catalogItem.product?.name}
                    </p>
                </div>

                <Form
                    action={route('supplier.catalog.update', catalogItem.id)}
                    method="put"
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Product Information
                                </h3>

                                <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {catalogItem.product?.name}
                                            </h4>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                SKU: {catalogItem.product?.slug}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="base_wholesale_price" required>
                                            Base Wholesale Price
                                        </Label>
                                        <Input
                                            id="base_wholesale_price"
                                            name="base_wholesale_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={baseWholesalePrice}
                                            onChange={(e) => setBaseWholesalePrice(e.target.value)}
                                            error={!!errors.base_wholesale_price}
                                            required
                                            placeholder="0.00"
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Default price for all buyers (before volume discounts)
                                        </p>
                                        <InputError message={errors.base_wholesale_price} />
                                    </div>

                                    <div>
                                        <Label htmlFor="min_order_quantity">
                                            Minimum Order Quantity
                                        </Label>
                                        <Input
                                            id="min_order_quantity"
                                            name="min_order_quantity"
                                            type="number"
                                            min="1"
                                            value={minOrderQuantity}
                                            onChange={(e) => setMinOrderQuantity(e.target.value)}
                                            error={!!errors.min_order_quantity}
                                        />
                                        <InputError message={errors.min_order_quantity} />
                                    </div>

                                    <div>
                                        <Label htmlFor="visibility" required>
                                            Visibility
                                        </Label>
                                        <Select
                                            options={visibilityOptions}
                                            value={visibility}
                                            onChange={(value) =>
                                                setVisibility(value as CatalogVisibility)
                                            }
                                        />
                                        <input type="hidden" name="visibility" value={visibility} />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            placeholder="Additional information for buyers..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="is_available"
                                            type="checkbox"
                                            checked={isAvailable}
                                            onChange={(e) => setIsAvailable(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor="is_available" className="mb-0">
                                            Available for purchase
                                        </Label>
                                        <input
                                            type="hidden"
                                            name="is_available"
                                            value={isAvailable ? '1' : '0'}
                                        />
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addPricingTier}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Tier
                                    </Button>
                                </div>

                                {pricingTiers.length > 0 ? (
                                    <div className="space-y-3">
                                        {pricingTiers.map((tier, index) => (
                                            <div
                                                key={tier.id || index}
                                                className="flex items-end gap-3 rounded-lg border p-4 dark:border-gray-700"
                                            >
                                                <div className="flex-1">
                                                    <Label htmlFor={`tier-${index}-min`}>
                                                        Min Qty
                                                    </Label>
                                                    <Input
                                                        id={`tier-${index}-min`}
                                                        type="number"
                                                        min="1"
                                                        value={tier.min_quantity}
                                                        onChange={(e) =>
                                                            updatePricingTier(
                                                                index,
                                                                'min_quantity',
                                                                parseInt(e.target.value)
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`pricing_tiers[${index}][min_quantity]`}
                                                        value={tier.min_quantity}
                                                    />
                                                    {tier.id && (
                                                        <input
                                                            type="hidden"
                                                            name={`pricing_tiers[${index}][id]`}
                                                            value={tier.id}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor={`tier-${index}-max`}>
                                                        Max Qty
                                                    </Label>
                                                    <Input
                                                        id={`tier-${index}-max`}
                                                        type="number"
                                                        min={tier.min_quantity}
                                                        value={tier.max_quantity?.toString() || ''}
                                                        onChange={(e) =>
                                                            updatePricingTier(
                                                                index,
                                                                'max_quantity',
                                                                e.target.value
                                                                    ? parseInt(e.target.value)
                                                                    : null
                                                            )
                                                        }
                                                        placeholder="Unlimited"
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`pricing_tiers[${index}][max_quantity]`}
                                                        value={tier.max_quantity?.toString() || ''}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor={`tier-${index}-price`}>
                                                        Price
                                                    </Label>
                                                    <Input
                                                        id={`tier-${index}-price`}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={tier.price}
                                                        onChange={(e) =>
                                                            updatePricingTier(
                                                                index,
                                                                'price',
                                                                parseFloat(e.target.value)
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`pricing_tiers[${index}][price]`}
                                                        value={tier.price}
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
                                        No volume pricing tiers defined. Buyers will pay the base
                                        wholesale price.
                                    </p>
                                )}
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Link href={route('supplier.catalog.index')}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
