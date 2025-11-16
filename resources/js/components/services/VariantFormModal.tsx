import ServiceVariantController from '@/actions/App/Http/Controllers/ServiceVariantController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Checkbox from '@/components/form/input/Checkbox';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { Service, ServiceVariant } from '@/types/service';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    service: Service;
    variant?: ServiceVariant | null;
}

export default function VariantFormModal({
    isOpen,
    onClose,
    service,
    variant,
}: Props) {
    const isEditing = !!variant;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: variant?.name || '',
        description: variant?.description || '',
        base_price: variant?.base_price?.toString() || '',
        customer_materials_price:
            variant?.customer_materials_price?.toString() || '',
        shop_materials_price: variant?.shop_materials_price?.toString() || '',
        estimated_duration_minutes:
            variant?.estimated_duration_minutes?.toString() || '',
        sort_order: variant?.sort_order?.toString() || '0',
        is_active: variant?.is_active ?? true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEditing && variant) {
            put(
                ServiceVariantController.update.url({
                    service: service.id,
                    variant: variant.id,
                }),
                {
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                },
            );
        } else {
            post(
                ServiceVariantController.store.url({
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
                    {isEditing ? 'Edit' : 'Add'} Service Variant
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {service.name}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="name">
                            Variant Name{' '}
                            <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={!!errors.name}
                            placeholder="e.g., Standard, Premium, Deluxe"
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
                            placeholder="Brief description of this variant"
                            rows={3}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="base_price">
                                Base Price{' '}
                                <span className="text-error-500">*</span>
                            </Label>
                            <Input
                                id="base_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.base_price}
                                onChange={(e) =>
                                    setData('base_price', e.target.value)
                                }
                                error={!!errors.base_price}
                                placeholder="0.00"
                            />
                            <InputError message={errors.base_price} />
                        </div>

                        <div>
                            <Label htmlFor="estimated_duration_minutes">
                                Duration (minutes)
                            </Label>
                            <Input
                                id="estimated_duration_minutes"
                                type="number"
                                min="0"
                                value={data.estimated_duration_minutes}
                                onChange={(e) =>
                                    setData(
                                        'estimated_duration_minutes',
                                        e.target.value,
                                    )
                                }
                                error={!!errors.estimated_duration_minutes}
                                placeholder="60"
                            />
                            <InputError
                                message={errors.estimated_duration_minutes}
                            />
                        </div>
                    </div>

                    {service.has_material_options && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="customer_materials_price">
                                    Customer Materials Price
                                </Label>
                                <Input
                                    id="customer_materials_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.customer_materials_price}
                                    onChange={(e) =>
                                        setData(
                                            'customer_materials_price',
                                            e.target.value,
                                        )
                                    }
                                    error={!!errors.customer_materials_price}
                                    placeholder="0.00"
                                />
                                <InputError
                                    message={errors.customer_materials_price}
                                />
                            </div>

                            <div>
                                <Label htmlFor="shop_materials_price">
                                    Shop Materials Price
                                </Label>
                                <Input
                                    id="shop_materials_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.shop_materials_price}
                                    onChange={(e) =>
                                        setData(
                                            'shop_materials_price',
                                            e.target.value,
                                        )
                                    }
                                    error={!!errors.shop_materials_price}
                                    placeholder="0.00"
                                />
                                <InputError
                                    message={errors.shop_materials_price}
                                />
                            </div>
                        </div>
                    )}

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
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                            />
                            <Label
                                htmlFor="is_active"
                                className="ml-2 mb-0 cursor-pointer"
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
                              ? 'Update Variant'
                              : 'Add Variant'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
