import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { ProductVariant } from '@/types/stockMovement';
import { router } from '@inertiajs/react';
import { Check, Store, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

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
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleShopToggle = (shopId: number) => {
        setSelectedShopIds((prev) =>
            prev.includes(shopId)
                ? prev.filter((id) => id !== shopId)
                : [...prev, shopId]
        );
        if (errors.shop_ids) {
            setErrors({});
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (selectedShopIds.length === 0) {
            setErrors({ shop_ids: 'Please select at least one location.' });
            return;
        }

        setProcessing(true);
        setErrors({});

        router.post(
            StockMovementController.setupLocations.url({ variant: variant.id }),
            { shop_ids: selectedShopIds },
            {
                onSuccess: () => {
                    setSelectedShopIds([]);
                    setProcessing(false);
                    onClose();
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
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
                    Select which locations should stock this product variant. Each selected location will start with 0 stock.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="shops">
                            Select Locations{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <div className="mt-3 space-y-2 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
                            {availableShops.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No active shops available. Please create a shop first.
                                </p>
                            ) : (
                                availableShops.map((shop) => (
                                    <label
                                        key={shop.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedShopIds.includes(
                                                shop.id
                                            )}
                                            onChange={() =>
                                                handleShopToggle(shop.id)
                                            }
                                            disabled={processing}
                                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                                        />
                                        <div className="flex flex-1 items-center gap-2">
                                            <Store className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {shop.name}
                                            </span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        {selectedShopIds.length === 0 && !errors.shop_ids && (
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
                        disabled={processing || selectedShopIds.length === 0}
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
            </form>
        </Modal>
    );
}
