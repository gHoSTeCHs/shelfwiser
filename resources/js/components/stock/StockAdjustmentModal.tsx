import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { InventoryLocation, ProductVariant } from '@/types/stockMovement';
import { useForm } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { FormEvent } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    variant: ProductVariant;
    locations: InventoryLocation[];
}

export default function StockAdjustmentModal({
    isOpen,
    onClose,
    variant,
    locations,
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_variant_id: variant.id,
        inventory_location_id: '' as string | number,
        quantity: 0,
        type: 'adjustment_in',
        reason: '',
        notes: '',
    });

    const adjustmentTypes = [
        { value: 'adjustment_in', label: 'Adjustment In (Add Stock)' },
        { value: 'adjustment_out', label: 'Adjustment Out (Remove Stock)' },
        { value: 'damage', label: 'Damage' },
        { value: 'loss', label: 'Loss' },
        { value: 'return', label: 'Return' },
    ];

    const locationOptions = locations.map((location) => ({
        value: location.id.toString(),
        label: `${location.location?.name || `Location #${location.id}`} - Available: ${location.quantity - location.reserved_quantity}${location.bin_location ? ` (${location.bin_location})` : ''}`,
    }));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post(StockMovementController.adjustStock.url(), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl p-6 sm:p-8"
        >
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Adjust Stock
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {variant.product?.name}
                    {variant.name && ` - ${variant.name}`}
                    <span className="ml-2 text-xs text-gray-500">
                        SKU: {variant.sku}
                    </span>
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="location">
                            Location <span className="text-error-500">*</span>
                        </Label>
                        <Select
                            options={locationOptions}
                            placeholder="Select location"
                            onChange={(value) =>
                                setData(
                                    'inventory_location_id',
                                    parseInt(value),
                                )
                            }
                            defaultValue={data.inventory_location_id.toString()}
                        />
                        <InputError message={errors.inventory_location_id} />
                    </div>

                    <div>
                        <Label htmlFor="adjustment_type">
                            Adjustment Type{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <Select
                            options={adjustmentTypes}
                            placeholder="Select adjustment type"
                            onChange={(value) => setData('type', value)}
                            defaultValue={data.type}
                        />
                        <InputError message={errors.type} />
                    </div>

                    <div>
                        <Label htmlFor="quantity">
                            Quantity <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={data.quantity.toString()}
                            onChange={(e) =>
                                setData(
                                    'quantity',
                                    parseInt(e.target.value) || 0,
                                )
                            }
                            min={1}
                            error={!!errors.quantity}
                            placeholder="Enter quantity"
                            required
                        />
                        <InputError message={errors.quantity} />
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Input
                            type="text"
                            id="reason"
                            name="reason"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            error={!!errors.reason}
                            placeholder="Brief reason for adjustment"
                        />
                        <InputError message={errors.reason} />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <TextArea
                            id="notes"
                            value={data.notes}
                            onChange={(value) => setData('notes', value)}
                            placeholder="Additional notes (optional)"
                            rows={3}
                            error={!!errors.notes}
                        />
                        <InputError message={errors.notes} />
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
                        disabled={processing}
                        className="bg-brand-600 hover:bg-brand-700"
                    >
                        {processing ? (
                            <>
                                <Check className="mr-2 h-4 w-4 animate-pulse" />
                                Adjusting...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Adjust Stock
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
