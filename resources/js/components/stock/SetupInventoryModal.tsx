import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import Checkbox from '@/components/form/input/Checkbox.tsx';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { ProductVariant } from '@/types/stockMovement';
import { Form } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    variant: ProductVariant;
    availableShops: Shop[];
}

export default function SetupInventoryModal({
    isOpen,
    onClose,
    variant,
    availableShops,
}: Props) {
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);

    const handleSuccess = () => {
        setSelectedShopIds([]);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl p-6 sm:p-8"
        >
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Setup Inventory Locations
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {variant.product?.name}
                    {variant.name && ` - ${variant.name}`}
                    <span className="ml-2 text-xs text-gray-500">
                        SKU: {variant.sku}
                    </span>
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Select which locations should stock this product variant.
                    Each selected location will start with 0 stock.
                </p>
            </div>

            <Form
                action={StockMovementController.setupLocations.url({
                    variant: variant.id,
                })}
                method="post"
                data={{
                    shop_ids: selectedShopIds,
                }}
                onSuccess={handleSuccess}
            >
                {({ errors, processing }) => (
                    <>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="shops">
                                    Select Locations{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <div className="mt-3 space-y-2 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
                                    {availableShops.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            No active shops available. Please
                                            create a shop first.
                                        </p>
                                    ) : (
                                        availableShops.map((shop) => (
                                            <div
                                                key={shop.id}
                                                className="rounded-md p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                <Checkbox
                                                    id={`shop-${shop.id}`}
                                                    checked={selectedShopIds.includes(
                                                        shop.id,
                                                    )}
                                                    onChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedShopIds([
                                                                ...selectedShopIds,
                                                                shop.id,
                                                            ]);
                                                        } else {
                                                            setSelectedShopIds(
                                                                selectedShopIds.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        shop.id,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                    label={shop.name}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                                {selectedShopIds.length === 0 && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Please select at least one location
                                    </p>
                                )}
                                <InputError message={errors.shop_ids} />
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing || selectedShopIds.length === 0
                                }
                                className="bg-brand-600 hover:bg-brand-700"
                            >
                                {processing ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4 animate-pulse" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Setup Locations
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </Modal>
    );
}
