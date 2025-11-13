import { ProductPackagingType, ProductVariant } from '@/types/stockMovement';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import { useMemo } from 'react';

interface PurchasePackagingFormProps {
    variant: ProductVariant | null;
    selectedPackagingTypeId?: number | null;
    packageQuantity: number;
    costPerPackage: number;
    onPackagingTypeChange: (packagingTypeId: number | null) => void;
    onPackageQuantityChange: (quantity: number) => void;
    onCostPerPackageChange: (cost: number) => void;
    required?: boolean;
}

/**
 * Component for recording product purchases with packaging information
 * Displays packaging options and calculates total cost and per-unit cost
 */
export default function PurchasePackagingForm({
    variant,
    selectedPackagingTypeId,
    packageQuantity,
    costPerPackage,
    onPackagingTypeChange,
    onPackageQuantityChange,
    onCostPerPackageChange,
    required = true,
}: PurchasePackagingFormProps) {
    const packagingTypes = useMemo(() => {
        if (!variant?.packaging_types) return [];
        return variant.packaging_types.filter((pt) => pt.is_active);
    }, [variant]);

    const selectedPackaging = useMemo(() => {
        if (!selectedPackagingTypeId) return null;
        return packagingTypes.find((pt) => pt.id === selectedPackagingTypeId) || null;
    }, [selectedPackagingTypeId, packagingTypes]);

    const totalUnits = useMemo(() => {
        if (!selectedPackaging) return 0;
        return packageQuantity * selectedPackaging.units_per_package;
    }, [selectedPackaging, packageQuantity]);

    const costPerBaseUnit = useMemo(() => {
        if (!selectedPackaging || costPerPackage === 0) return 0;
        return costPerPackage / selectedPackaging.units_per_package;
    }, [selectedPackaging, costPerPackage]);

    const totalCost = useMemo(() => {
        return packageQuantity * costPerPackage;
    }, [packageQuantity, costPerPackage]);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    if (!variant || packagingTypes.length === 0) {
        return (
            <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/10">
                <p className="text-sm text-warning-800 dark:text-warning-200">
                    No packaging types available for this product. Please add packaging types first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <Label>
                    How did you purchase this product?
                    {required && <span className="text-error-500"> *</span>}
                </Label>
                <Select
                    options={packagingTypes.map((pt) => {
                        const displayName = pt.display_name || pt.name;
                        return {
                            value: pt.id.toString(),
                            label: `${displayName} (${pt.units_per_package} ${variant.base_unit_name}${pt.units_per_package > 1 ? 's' : ''} per package)`,
                        };
                    })}
                    placeholder="Select packaging type"
                    onChange={(value) => onPackagingTypeChange(value ? parseInt(value) : null)}
                    value={selectedPackagingTypeId?.toString() || ''}
                    defaultValue=""
                />
            </div>

            {selectedPackaging && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>
                                Number of {selectedPackaging.display_name || selectedPackaging.name}(s)
                                {required && <span className="text-error-500"> *</span>}
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                value={packageQuantity}
                                onChange={(e) =>
                                    onPackageQuantityChange(parseInt(e.target.value) || 1)
                                }
                            />
                        </div>

                        <div>
                            <Label>
                                Cost per {selectedPackaging.display_name || selectedPackaging.name}
                                {required && <span className="text-error-500"> *</span>}
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={costPerPackage}
                                onChange={(e) =>
                                    onCostPerPackageChange(parseFloat(e.target.value) || 0)
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2 rounded-lg bg-white p-3 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total Units</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {totalUnits} {variant.base_unit_name}
                                {totalUnits > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                                Cost per {variant.base_unit_name}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(costPerBaseUnit)}
                            </span>
                        </div>

                        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    Total Cost
                                </span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(totalCost)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {selectedPackaging.cost_price && selectedPackaging.cost_price > 0 && (
                        <div className="rounded-lg border border-info-200 bg-info-50 p-3 dark:border-info-800 dark:bg-info-900/10">
                            <p className="text-xs text-info-800 dark:text-info-200">
                                <strong>Previous cost:</strong> {formatCurrency(selectedPackaging.cost_price)} per package
                                {costPerPackage !== selectedPackaging.cost_price && (
                                    <span className="ml-2">
                                        (
                                        {costPerPackage > selectedPackaging.cost_price
                                            ? `+${formatCurrency(costPerPackage - selectedPackaging.cost_price)}`
                                            : `-${formatCurrency(selectedPackaging.cost_price - costPerPackage)}`}
                                        )
                                    </span>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
