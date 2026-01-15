import SupplierCatalogController from '@/actions/App/Http/Controllers/SupplierCatalogController.ts';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { Product } from '@/types/product';
import { CatalogVisibility } from '@/types/supplier';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';

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
    const [productId, setProductId] = useState<string>('');
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [baseWholesalePrice, setBaseWholesalePrice] = useState<string>('');
    const [minOrderQuantity, setMinOrderQuantity] = useState<string>('1');
    const [visibility, setVisibility] =
        useState<CatalogVisibility>('connections_only');
    const [description, setDescription] = useState<string>('');
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

    const addPricingTier = () => {
        const newTier: PricingTier = {
            min_quantity:
                pricingTiers.length > 0
                    ? (pricingTiers[pricingTiers.length - 1].max_quantity ||
                          0) + 1
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
        value: number | null,
    ) => {
        const updated = [...pricingTiers];
        updated[index] = { ...updated[index], [field]: value };
        setPricingTiers(updated);
    };

    if (products.length === 0) {
        return (
            <>
                <Head title="Add Product to Catalog" />
                <div className="space-y-6">
                    <EmptyState
                        icon={<DollarSign className="h-12 w-12" />}
                        title="No products available"
                        description="You need to create products first before adding them to your supplier catalog"
                        action={
                            <Link href={SupplierCatalogController.index.url()}>
                                <Button>Go Back</Button>
                            </Link>
                        }
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Add Product to Catalog" />

            <div className="space-y-6">
                <div>
                    <Link
                        href={SupplierCatalogController.index.url()}
                        className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Catalog
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Add Product to Catalog
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Make your product available to buyers with custom
                        pricing
                    </p>
                </div>

                <Form
                    {...SupplierCatalogController.store.form()}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
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
                                            value={productId}
                                            onChange={setProductId}
                                            placeholder="Choose a product..."
                                        />
                                        <input
                                            type="hidden"
                                            name="product_id"
                                            value={productId}
                                        />
                                        <InputError
                                            message={errors.product_id}
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="base_wholesale_price"
                                            required
                                        >
                                            Base Wholesale Price
                                        </Label>
                                        <Input
                                            id="base_wholesale_price"
                                            name="base_wholesale_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={baseWholesalePrice}
                                            onChange={(e) =>
                                                setBaseWholesalePrice(
                                                    e.target.value,
                                                )
                                            }
                                            error={
                                                !!errors.base_wholesale_price
                                            }
                                            required
                                            placeholder="0.00"
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Default price for all buyers (before
                                            volume discounts)
                                        </p>
                                        <InputError
                                            message={
                                                errors.base_wholesale_price
                                            }
                                        />
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
                                            onChange={(e) =>
                                                setMinOrderQuantity(
                                                    e.target.value,
                                                )
                                            }
                                            error={!!errors.min_order_quantity}
                                        />
                                        <InputError
                                            message={errors.min_order_quantity}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="visibility" required>
                                            Visibility
                                        </Label>
                                        <Select
                                            options={visibilityOptions}
                                            value={visibility}
                                            onChange={(value) =>
                                                setVisibility(
                                                    value as CatalogVisibility,
                                                )
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            name="visibility"
                                            value={visibility}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <TextArea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Additional information for buyers..."
                                        />
                                    </div>

                                    <div>
                                        <Checkbox
                                            id="is_available"
                                            checked={isAvailable}
                                            onChange={setIsAvailable}
                                            label="Available for purchase"
                                        />
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
                                                key={index}
                                                className="flex items-end gap-3 rounded-lg border p-4 dark:border-gray-700"
                                            >
                                                <div className="flex-1">
                                                    <Label
                                                        htmlFor={`tier-${index}-min`}
                                                    >
                                                        Min Qty
                                                    </Label>
                                                    <Input
                                                        id={`tier-${index}-min`}
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            tier.min_quantity
                                                        }
                                                        onChange={(e) =>
                                                            updatePricingTier(
                                                                index,
                                                                'min_quantity',
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`pricing_tiers[${index}][min_quantity]`}
                                                        value={
                                                            tier.min_quantity
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label
                                                        htmlFor={`tier-${index}-max`}
                                                    >
                                                        Max Qty
                                                    </Label>
                                                    <Input
                                                        id={`tier-${index}-max`}
                                                        type="number"
                                                        min={tier.min_quantity}
                                                        value={
                                                            tier.max_quantity?.toString() ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            updatePricingTier(
                                                                index,
                                                                'max_quantity',
                                                                e.target.value
                                                                    ? parseInt(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      )
                                                                    : null,
                                                            )
                                                        }
                                                        placeholder="Unlimited"
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`pricing_tiers[${index}][max_quantity]`}
                                                        value={
                                                            tier.max_quantity?.toString() ||
                                                            ''
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label
                                                        htmlFor={`tier-${index}-price`}
                                                    >
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
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ),
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
                                                    onClick={() =>
                                                        removePricingTier(index)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                        No volume pricing tiers defined. Buyers
                                        will pay the base wholesale price.
                                    </p>
                                )}
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Link
                                    href={SupplierCatalogController.index.url()}
                                >
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Adding...'
                                        : 'Add to Catalog'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
