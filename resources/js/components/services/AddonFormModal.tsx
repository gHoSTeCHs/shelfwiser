import ServiceAddonController from '@/actions/App/Http/Controllers/ServiceAddonController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { Service, ServiceAddon } from '@/types/service';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    service: Service;
    addon?: ServiceAddon | null;
}

export default function AddonFormModal({
    isOpen,
    onClose,
    service,
    addon,
}: Props) {
    const isEditing = !!addon;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: addon?.name || '',
        description: addon?.description || '',
        price: addon?.price?.toString() || '',
        allows_quantity: addon?.allows_quantity ?? false,
        max_quantity: addon?.max_quantity?.toString() || '',
        sort_order: addon?.sort_order?.toString() || '0',
        is_active: addon?.is_active ?? true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEditing && addon) {
            // Update existing addon
            put(
                ServiceAddonController.update.url({
                    addon: addon.id,
                }),
                {
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                },
            );
        } else {
            // Create new addon for service
            post(
                ServiceAddonController.store.url({
                    service: service.id,
                }),
                {
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                },
            );
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Edit' : 'Add'} Service Add-on
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {service.name}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="name">
                            Add-on Name{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={!!errors.name}
                            placeholder="e.g., Express Service, Premium Package"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <TextArea
                            id="description"
                            value={data.description}
                            onChange={(value) => setData('description', value)}
                            error={!!errors.description}
                            placeholder="Brief description of this add-on"
                            rows={3}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div>
                        <Label htmlFor="price">
                            Price <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            error={!!errors.price}
                            placeholder="0.00"
                        />
                        <InputError message={errors.price} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <Checkbox
                                id="allows_quantity"
                                checked={data.allows_quantity}
                                onChange={(checked) =>
                                    setData('allows_quantity', checked)
                                }
                            />
                            <Label
                                htmlFor="allows_quantity"
                                className="mb-0 ml-2 cursor-pointer"
                            >
                                Allow Multiple Quantities
                            </Label>
                        </div>

                        {data.allows_quantity && (
                            <div>
                                <Label htmlFor="max_quantity">
                                    Maximum Quantity (Optional)
                                </Label>
                                <Input
                                    id="max_quantity"
                                    type="number"
                                    min="1"
                                    value={data.max_quantity}
                                    onChange={(e) =>
                                        setData('max_quantity', e.target.value)
                                    }
                                    error={!!errors.max_quantity}
                                    placeholder="Leave empty for unlimited"
                                    hint="Leave empty for unlimited quantity"
                                />
                                <InputError message={errors.max_quantity} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData('sort_order', e.target.value)
                                }
                                error={!!errors.sort_order}
                                placeholder="0"
                                hint="Lower numbers appear first"
                            />
                            <InputError message={errors.sort_order} />
                        </div>

                        <div className="flex items-center pt-6">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onChange={(checked) =>
                                    setData('is_active', checked)
                                }
                            />
                            <Label
                                htmlFor="is_active"
                                className="mb-0 ml-2 cursor-pointer"
                            >
                                Active
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing
                            ? 'Saving...'
                            : isEditing
                              ? 'Update Add-on'
                              : 'Add Add-on'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
