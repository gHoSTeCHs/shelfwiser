import StockMovementController from '@/actions/App/Http/Controllers/StockMovementController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { InventoryLocation, ProductVariant } from '@/types/stockMovement';
import { Form } from '@inertiajs/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    variant: ProductVariant;
    locations: InventoryLocation[];
}

export default function StockTransferModal({
    isOpen,
    onClose,
    variant,
    locations,
}: Props) {
    const [fromLocationId, setFromLocationId] = useState<string>('');
    const [toLocationId, setToLocationId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleSuccess = () => {
        setFromLocationId('');
        setToLocationId('');
        setQuantity('');
        setReason('');
        setNotes('');
        onClose();
    };

    const getAvailableQuantity = (locationId: string): number => {
        const location = locations.find(
            (loc) => loc.id === parseInt(locationId),
        );
        if (!location) return 0;
        return location.quantity - location.reserved_quantity;
    };

    const fromLocationOptions = locations
        .filter((loc) => loc.id.toString() !== toLocationId)
        .map((location) => ({
            value: location.id.toString(),
            label: `${location.location?.name || `Location #${location.id}`} - Available: ${location.quantity - location.reserved_quantity}`,
        }));

    const toLocationOptions = locations
        .filter((loc) => loc.id.toString() !== fromLocationId)
        .map((location) => ({
            value: location.id.toString(),
            label: `${location.location?.name || `Location #${location.id}`} - Current: ${location.quantity}`,
        }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl p-6 sm:p-8"
        >
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Transfer Stock
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {variant.product?.name}
                    {variant.name && ` - ${variant.name}`}
                    <span className="ml-2 text-xs text-gray-500">
                        SKU: {variant.sku}
                    </span>
                </p>
            </div>

            <Form
                action={StockMovementController.transferStock.url()}
                method="post"
                onSuccess={handleSuccess}
            >
                {({ errors, processing }) => (
                    <>
                        <div className="space-y-5">
                            <div>
                                <Label htmlFor="from_location">
                                    From Location{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <Select
                                    options={fromLocationOptions}
                                    placeholder="Select source location"
                                    onChange={(value) =>
                                        setFromLocationId(value)
                                    }
                                    defaultValue={fromLocationId}
                                />
                                <InputError message={errors.from_location_id} />
                            </div>

                            <div className="flex items-center justify-center py-2">
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>

                            <div>
                                <Label htmlFor="to_location">
                                    To Location{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <Select
                                    options={toLocationOptions}
                                    placeholder="Select destination location"
                                    onChange={(value) => setToLocationId(value)}
                                    defaultValue={toLocationId}
                                />
                                <InputError message={errors.to_location_id} />
                            </div>

                            <div>
                                <Label htmlFor="quantity">
                                    Quantity{' '}
                                    <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(e.target.value)
                                    }
                                    min={1}
                                    max={
                                        fromLocationId
                                            ? getAvailableQuantity(
                                                  fromLocationId,
                                              )
                                            : undefined
                                    }
                                    error={!!errors.quantity}
                                    placeholder="Enter quantity to transfer"
                                    required
                                />
                                {fromLocationId && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Available to transfer:{' '}
                                        {getAvailableQuantity(fromLocationId)}{' '}
                                        units
                                    </p>
                                )}
                                <InputError message={errors.quantity} />
                            </div>

                            <div>
                                <Label htmlFor="reason">Reason</Label>
                                <Input
                                    type="text"
                                    id="reason"
                                    name="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    error={!!errors.reason}
                                    placeholder="Brief reason for transfer"
                                />
                                <InputError message={errors.reason} />
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <TextArea
                                    id="notes"
                                    value={notes}
                                    onChange={(value) => setNotes(value)}
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
                                        Transferring...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Transfer Stock
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
