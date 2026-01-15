import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import PurchasePackagingForm from '@/components/inventory/PurchasePackagingForm';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { InventoryLocation, ProductVariant } from '@/types/stockMovement';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface Props {
    products: ProductVariant[];
    locations: InventoryLocation[];
}

/**
 * Page for recording product purchases with packaging information
 * Uses PurchasePackagingForm component for packaging selection and cost calculation
 */
export default function Create({ products, locations }: Props) {
    const [productVariantId, setProductVariantId] = useState<number | ''>('');
    const [locationId, setLocationId] = useState<number | ''>('');
    const [packagingTypeId, setPackagingTypeId] = useState<number | null>(null);
    const [packageQuantity, setPackageQuantity] = useState(1);
    const [costPerPackage, setCostPerPackage] = useState(0);
    const [notes, setNotes] = useState('');

    const selectedVariant =
        products.find((p) => p.id === productVariantId) || null;

    const getProductLabel = (product: ProductVariant): string => {
        const productName = product.product?.name || 'Unknown';
        const variantName = product.name ? ` - ${product.name}` : '';
        const sku = ` (${product.sku})`;
        return `${productName}${variantName}${sku}`;
    };

    const getLocationLabel = (location: InventoryLocation): string => {
        return location.location?.name || `Location #${location.id}`;
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const selectedPackaging = selectedVariant?.packaging_types?.find(
        (pt) => pt.id === packagingTypeId,
    );

    const canSubmit =
        productVariantId &&
        locationId &&
        packagingTypeId &&
        packageQuantity > 0 &&
        costPerPackage > 0;

    return (
        <>
            <Head title="Record Purchase" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/stock-movements"
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Stock Movements
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Record Purchase
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Record a new product purchase and update inventory
                        </p>
                    </div>
                </div>

                <Form
                    action={StockMovementController.recordPurchase.url()}
                    method="post"
                    className="space-y-6"
                    transform={(data) => ({
                        ...data,
                        product_variant_id: productVariantId,
                        location_id: locationId,
                        product_packaging_type_id: packagingTypeId,
                        package_quantity: packageQuantity,
                        cost_per_package: costPerPackage,
                        notes: notes || null,
                    })}
                >
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card title="Purchase Details">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="product_variant_id">
                                            Product{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={products.map((p) => ({
                                                value: p.id.toString(),
                                                label: getProductLabel(p),
                                            }))}
                                            placeholder="Select product"
                                            onChange={(value) => {
                                                setProductVariantId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                );
                                                // Reset packaging when product changes
                                                setPackagingTypeId(null);
                                                setPackageQuantity(1);
                                                setCostPerPackage(0);
                                            }}
                                            defaultValue=""
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="location_id">
                                            Storage Location{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={
                                                selectedVariant?.inventory_locations?.map(
                                                    (loc) => ({
                                                        value: loc.id.toString(),
                                                        label: `${getLocationLabel(loc)} (Current: ${loc.quantity} ${selectedVariant.base_unit_name}${loc.quantity !== 1 ? 's' : ''})`,
                                                    }),
                                                ) || []
                                            }
                                            placeholder={
                                                selectedVariant
                                                    ? 'Select storage location'
                                                    : 'Select a product first'
                                            }
                                            onChange={(value) =>
                                                setLocationId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                )
                                            }
                                            defaultValue=""
                                            disabled={!selectedVariant}
                                        />
                                        {!selectedVariant?.inventory_locations ||
                                            (selectedVariant.inventory_locations
                                                .length === 0 && (
                                                <p className="mt-1 text-xs text-warning-600 dark:text-warning-400">
                                                    No storage locations found
                                                    for this product. Please set
                                                    up inventory locations
                                                    first.
                                                </p>
                                            ))}
                                    </div>
                                </div>
                            </Card>

                            <Card title="Packaging & Cost">
                                <PurchasePackagingForm
                                    variant={selectedVariant}
                                    selectedPackagingTypeId={packagingTypeId}
                                    packageQuantity={packageQuantity}
                                    costPerPackage={costPerPackage}
                                    onPackagingTypeChange={setPackagingTypeId}
                                    onPackageQuantityChange={setPackageQuantity}
                                    onCostPerPackageChange={setCostPerPackage}
                                    required={true}
                                />
                            </Card>

                            <Card title="Additional Information">
                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <TextArea
                                        id="notes"
                                        value={notes}
                                        onChange={(value) => setNotes(value)}
                                        placeholder="Add any notes about this purchase (e.g., supplier, invoice number)"
                                        rows={4}
                                    />
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            {selectedPackaging && (
                                <Card title="Purchase Summary">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Packaging Type
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {selectedPackaging.display_name ||
                                                    selectedPackaging.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Quantity
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {packageQuantity} package
                                                {packageQuantity !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Total Units
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {packageQuantity *
                                                    selectedPackaging.units_per_package}{' '}
                                                {
                                                    selectedVariant?.base_unit_name
                                                }
                                                {packageQuantity *
                                                    selectedPackaging.units_per_package >
                                                1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>

                                        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Total Cost
                                                </span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        packageQuantity *
                                                            costPerPackage,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={!canSubmit}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Record Purchase
                            </Button>

                            {!canSubmit && (
                                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    Please fill all required fields
                                </p>
                            )}
                        </div>
                    </div>
                </Form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
