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
    const [fromLocationId, setFromLocationId] = useState<number | ''>('');
    const [toLocationId, setToLocationId] = useState<number | ''>('');
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

    const getAvailableQuantity = (locationId: number): number => {
        const location = locations.find((loc) => loc.id === locationId);
        if (!location) return 0;
        return location.quantity - location.reserved_quantity;
    };

    const selectedFromLocation = locations.find(
        (loc) => loc.id === fromLocationId
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
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
                data={{
                    product_variant_id: variant.id,
                    from_location_id: fromLocationId,
                    to_location_id: toLocationId,
                    quantity: parseInt(quantity) || 0,
                    reason,
                    notes,
                }}
                onSuccess={handleSuccess}
            >
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="from_location">
                            From Location <span className="text-error-500">*</span>
                        </Label>
                        <Select
                            id="from_location"
                            value={fromLocationId}
                            onChange={(e) =>
                                setFromLocationId(Number(e.target.value) || '')
                            }
                            required
                        >
                            <option value="">Select source location</option>
                            {locations
                                .filter((loc) => loc.id !== toLocationId)
                                .map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.locatable?.name ||
                                            `Location #${location.id}`}
                                        {' - '}
                                        Available:{' '}
                                        {location.quantity - location.reserved_quantity}
                                        {location.bin_location &&
                                            ` (${location.bin_location})`}
                                    </option>
                                ))}
                        </Select>
                        <InputError message="" />
                    </div>

                    <div className="flex items-center justify-center py-2">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div>
                        <Label htmlFor="to_location">
                            To Location <span className="text-error-500">*</span>
                        </Label>
                        <Select
                            id="to_location"
                            value={toLocationId}
                            onChange={(e) =>
                                setToLocationId(Number(e.target.value) || '')
                            }
                            required
                        >
                            <option value="">Select destination location</option>
                            {locations
                                .filter((loc) => loc.id !== fromLocationId)
                                .map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.locatable?.name ||
                                            `Location #${location.id}`}
                                        {' - '}
                                        Current: {location.quantity}
                                        {location.bin_location &&
                                            ` (${location.bin_location})`}
                                    </option>
                                ))}
                        </Select>
                        <InputError message="" />
                    </div>

                    <div>
                        <Label htmlFor="quantity">
                            Quantity <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min={1}
                            max={
                                fromLocationId
                                    ? getAvailableQuantity(Number(fromLocationId))
                                    : undefined
                            }
                            required
                            placeholder="Enter quantity to transfer"
                        />
                        {fromLocationId && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Available to transfer:{' '}
                                {getAvailableQuantity(Number(fromLocationId))} units
                            </p>
                        )}
                        <InputError message="" />
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Input
                            type="text"
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Brief reason for transfer"
                        />
                        <InputError message="" />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <TextArea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes (optional)"
                            rows={3}
                        />
                        <InputError message="" />
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-brand-600 hover:bg-brand-700">
                        <Check className="mr-2 h-4 w-4" />
                        Transfer Stock
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
