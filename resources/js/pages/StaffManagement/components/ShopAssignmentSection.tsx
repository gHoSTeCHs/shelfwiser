import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import MultiSelect from '@/components/form/MultiSelect';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import type { Shop } from '@/types/shop';
import type { CreateStaffFormData, Role } from '@/types/staff';
import { AlertCircle, Store } from 'lucide-react';
import type { FC } from 'react';
import { useMemo } from 'react';

interface ShopAssignmentSectionProps {
    data: CreateStaffFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof CreateStaffFormData>(
        field: K,
        value: CreateStaffFormData[K],
    ) => void;
    shops: Shop[];
    roles: Role[];
}

const ShopAssignmentSection: FC<ShopAssignmentSectionProps> = ({
    data,
    errors,
    onChange,
    shops,
    roles,
}) => {
    const selectedRole = useMemo(() => {
        return roles.find((r) => r.value === data.role);
    }, [roles, data.role]);

    const canAccessMultipleShops =
        selectedRole?.can_access_multiple_shops ?? false;
    const isHighLevelRole = (selectedRole?.level ?? 0) >= 80;

    const shopOptions = shops.map((shop) => ({
        value: shop.id,
        label: shop.name,
        description: shop.address || undefined,
    }));

    const handleShopChange = (values: (string | number)[]) => {
        const numericValues = values.map((v) =>
            typeof v === 'string' ? parseInt(v) : v,
        );

        if (!canAccessMultipleShops && numericValues.length > 1) {
            onChange('shop_ids', [numericValues[numericValues.length - 1]]);
        } else {
            onChange('shop_ids', numericValues);
        }
    };

    return (
        <CollapsibleSection
            title="Shop Assignment"
            description="Assign staff to one or more shops"
            icon={Store}
            defaultOpen={true}
        >
            <div className="space-y-4">
                {!data.role && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Please select a role first to determine shop
                            assignment options.
                        </p>
                    </div>
                )}

                {data.role && (
                    <>
                        <div>
                            <Label htmlFor="shop_ids" required>
                                {canAccessMultipleShops
                                    ? 'Assigned Shops'
                                    : 'Assigned Shop'}
                            </Label>
                            <MultiSelect
                                id="shop_ids"
                                name="shop_ids"
                                options={shopOptions}
                                value={data.shop_ids}
                                onChange={handleShopChange}
                                placeholder={
                                    canAccessMultipleShops
                                        ? 'Select one or more shops'
                                        : 'Select a shop'
                                }
                                error={
                                    !!errors.shop_ids || !!errors['shop_ids.0']
                                }
                            />
                            <InputError
                                message={
                                    errors.shop_ids || errors['shop_ids.0']
                                }
                            />
                        </div>

                        {selectedRole && (
                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedRole.label}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            {selectedRole.description}
                                        </p>
                                    </div>
                                    {canAccessMultipleShops ? (
                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Multi-shop access
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            Single shop only
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {isHighLevelRole && (
                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    This role ({selectedRole?.label}) has access
                                    to all shops by default. Shop assignments
                                    here are for organizational purposes.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {shops.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
                        <Store className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            No shops available. Please create a shop first.
                        </p>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default ShopAssignmentSection;
