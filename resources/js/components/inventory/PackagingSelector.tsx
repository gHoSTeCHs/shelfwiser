import { ProductPackagingType, ProductVariant } from '@/types/stockMovement';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import { useMemo } from 'react';

interface PackagingSelectorProps {
    variant: ProductVariant | null;
    selectedPackagingTypeId?: number | null;
    packageQuantity: number;
    onPackagingTypeChange: (packagingTypeId: number | null) => void;
    onPackageQuantityChange: (quantity: number) => void;
    showLabel?: boolean;
    required?: boolean;
}

/**
 * Component for selecting packaging type and quantity when selling products
 * Displays available packaging options with stock levels and handles quantity input
 */
export default function PackagingSelector({
    variant,
    selectedPackagingTypeId,
    packageQuantity,
    onPackagingTypeChange,
    onPackageQuantityChange,
    showLabel = true,
    required = false,
}: PackagingSelectorProps) {
    const packagingTypes = useMemo(() => {
        if (!variant?.packaging_types) return [];
        return variant.packaging_types.filter((pt) => pt.is_active);
    }, [variant]);

    const selectedPackaging = useMemo(() => {
        if (!selectedPackagingTypeId) return null;
        return packagingTypes.find((pt) => pt.id === selectedPackagingTypeId) || null;
    }, [selectedPackagingTypeId, packagingTypes]);

    const availableStock = useMemo(() => {
        if (!variant?.inventory_locations) return 0;
        return variant.inventory_locations.reduce(
            (sum, loc) => sum + (loc.quantity - loc.reserved_quantity),
            0,
        );
    }, [variant]);

    const getPackageStock = (packagingType: ProductPackagingType): number => {
        if (!packagingType.units_per_package || packagingType.units_per_package === 0) {
            return 0;
        }
        return Math.floor(availableStock / packagingType.units_per_package);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    if (!variant || packagingTypes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {showLabel && (
                <Label>
                    How to sell
                    {required && <span className="text-error-500"> *</span>}
                </Label>
            )}

            <Select
                options={packagingTypes.map((pt) => {
                    const stock = getPackageStock(pt);
                    const displayName = pt.display_name || pt.name;
                    const priceInfo = formatCurrency(pt.price);

                    return {
                        value: pt.id.toString(),
                        label: `${displayName} (${pt.units_per_package} ${variant.base_unit_name}${pt.units_per_package > 1 ? 's' : ''}) - ${priceInfo} - ${stock} available`,
                    };
                })}
                placeholder="Select packaging type"
                onChange={(value) => onPackagingTypeChange(value ? parseInt(value) : null)}
                value={selectedPackagingTypeId?.toString() || ''}
                defaultValue=""
            />

            {selectedPackaging && (
                <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                    <div>
                        <Label>
                            Number of {selectedPackaging.display_name || selectedPackaging.name}(s)
                            {required && <span className="text-error-500"> *</span>}
                        </Label>
                        <Input
                            type="number"
                            min="1"
                            max={getPackageStock(selectedPackaging)}
                            value={packageQuantity}
                            onChange={(e) =>
                                onPackageQuantityChange(parseInt(e.target.value) || 1)
                            }
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Max: {getPackageStock(selectedPackaging)} packages available
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Total Units</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {packageQuantity * selectedPackaging.units_per_package}{' '}
                                {variant.base_unit_name}
                                {packageQuantity * selectedPackaging.units_per_package > 1 ? 's' : ''}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Price per unit</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(selectedPackaging.price / selectedPackaging.units_per_package)}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-600 dark:text-gray-400">Line Total</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(packageQuantity * selectedPackaging.price)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
