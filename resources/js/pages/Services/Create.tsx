/* eslint-disable @typescript-eslint/no-explicit-any */

import ServiceController from '@/actions/App/Http/Controllers/ServiceController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { flattenCategories } from '@/lib/utils';
import { ServiceCategory } from '@/types/service';
import { Shop } from '@/types/shop';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Minus, Plus, Save } from 'lucide-react';
import { useState } from 'react';

interface Props {
    shops: Shop[];
    categories: ServiceCategory[];
}

interface ServiceVariantForm {
    id: string;
    name: string;
    description: string;
    base_price: string;
    customer_materials_price: string;
    shop_materials_price: string;
    estimated_duration_minutes: string;
    sort_order: number;
    is_active: boolean;
}

export default function Create({ shops, categories }: Props) {
    const [shopId, setShopId] = useState<number | ''>('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [serviceName, setServiceName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [hasMaterialOptions, setHasMaterialOptions] =
        useState<boolean>(false);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isAvailableOnline, setIsAvailableOnline] = useState<boolean>(true);

    const [variants, setVariants] = useState<ServiceVariantForm[]>([
        {
            id: crypto.randomUUID(),
            name: '',
            description: '',
            base_price: '',
            customer_materials_price: '',
            shop_materials_price: '',
            estimated_duration_minutes: '',
            sort_order: 0,
            is_active: true,
        },
    ]);

    const addVariant = () => {
        setVariants([
            ...variants,
            {
                id: crypto.randomUUID(),
                name: '',
                description: '',
                base_price: '',
                customer_materials_price: '',
                shop_materials_price: '',
                estimated_duration_minutes: '',
                sort_order: variants.length,
                is_active: true,
            },
        ]);
    };

    const removeVariant = (id: string) => {
        if (variants.length > 1) {
            setVariants(variants.filter((v) => v.id !== id));
        }
    };

    const updateVariant = (
        id: string,
        field: keyof ServiceVariantForm,
        value: any,
    ) => {
        setVariants(
            variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
        );
    };

    const flatCategories = flattenCategories(categories);

    return (
        <>
            <Head title="Create Service" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={'/services'}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Service
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Add a new service to your shop
                        </p>
                    </div>
                </div>

                <Form
                    action={ServiceController.store.url()}
                    method="post"
                    transform={(data) => ({
                        ...data,
                        has_material_options: hasMaterialOptions ? '1' : '0',
                        is_active: isActive ? '1' : '0',
                        is_available_online: isAvailableOnline ? '1' : '0',
                    })}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <Card title="Basic Information">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="shop_id">
                                            Shop{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Select a shop',
                                                },
                                                ...shops.map((shop) => ({
                                                    value: shop.id.toString(),
                                                    label: shop.name,
                                                })),
                                            ]}
                                            placeholder="Select a shop"
                                            onChange={(value) =>
                                                setShopId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                )
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="shop_id"
                                            value={shopId}
                                        />
                                        <InputError message={errors.shop_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="service_category_id">
                                            Category (Optional)
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'No Category',
                                                },
                                                ...flatCategories.map(
                                                    (cat) => ({
                                                        value: cat.value.toString(),
                                                        label: cat.label,
                                                    }),
                                                ),
                                            ]}
                                            placeholder="Select a category"
                                            onChange={(value) =>
                                                setCategoryId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                )
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="service_category_id"
                                            value={categoryId}
                                        />
                                        <InputError
                                            message={errors.service_category_id}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="name">
                                            Service Name{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            name="name"
                                            id="name"
                                            placeholder="e.g., Hair Braiding, Manicure"
                                            value={serviceName}
                                            onChange={(e) =>
                                                setServiceName(e.target.value)
                                            }
                                            error={!!errors.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <TextArea
                                            id="description"
                                            name={'description'}
                                            placeholder="Describe what this service includes..."
                                            rows={3}
                                            value={description}
                                            onChange={(value) =>
                                                setDescription(value)
                                            }
                                            error={!!errors.description}
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="image_url">
                                            Image URL (Optional)
                                        </Label>
                                        <Input
                                            type="url"
                                            name="image_url"
                                            id="image_url"
                                            placeholder="https://example.com/image.jpg"
                                            value={imageUrl}
                                            onChange={(e) =>
                                                setImageUrl(e.target.value)
                                            }
                                            error={!!errors.image_url}
                                        />
                                        <InputError
                                            message={errors.image_url}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="has_material_options"
                                            checked={hasMaterialOptions}
                                            onChange={() => {}}
                                        />
                                        <Label
                                            htmlFor="has_material_options"
                                            className="mb-0 font-normal"
                                        >
                                            Service has material options
                                            (customer vs shop materials)
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_available_online"
                                            checked={isAvailableOnline}
                                            onChange={() => {}}
                                        />
                                        <Label
                                            htmlFor="is_available_online"
                                            className="mb-0 font-normal"
                                        >
                                            Available for online booking
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={isActive}
                                            onChange={() => {}}
                                        />
                                        <Label
                                            htmlFor="is_active"
                                            className="mb-0 font-normal"
                                        >
                                            Active
                                        </Label>
                                    </div>
                                </div>
                            </Card>

                            {/* Service Variants */}
                            <Card
                                title="Service Variants"
                                description="Add different options or types for this service"
                            >
                                <div className="space-y-6">
                                    {variants.map((variant, index) => (
                                        <div
                                            key={variant.id}
                                            className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Variant {index + 1}
                                                </h4>
                                                {variants.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeVariant(
                                                                variant.id,
                                                            )
                                                        }
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <Label
                                                        htmlFor={`variant-${index}-name`}
                                                    >
                                                        Variant Name{' '}
                                                        <span className="text-error-500">
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        id={`variant-${index}-name`}
                                                        name={`variants[${index}][name]`}
                                                        placeholder="e.g., Fishtail Braids, Basic Manicure"
                                                        value={variant.name}
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                variant.id,
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        error={
                                                            !!errors[
                                                                `variants.${index}.name`
                                                            ]
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `variants.${index}.name`
                                                            ]
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <Label
                                                        htmlFor={`variant-${index}-description`}
                                                    >
                                                        Description
                                                    </Label>
                                                    <TextArea
                                                        id={`variant-${index}-description`}
                                                        name={`variants[${index}][description]`}
                                                        placeholder="Describe this variant..."
                                                        rows={2}
                                                        value={
                                                            variant.description
                                                        }
                                                        onChange={(value) =>
                                                            updateVariant(
                                                                variant.id,
                                                                'description',
                                                                value,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <Label
                                                        htmlFor={`variant-${index}-base_price`}
                                                    >
                                                        Base Price (₦){' '}
                                                        <span className="text-error-500">
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        id={`variant-${index}-base_price`}
                                                        name={`variants[${index}][base_price]`}
                                                        placeholder="0.00"
                                                        value={
                                                            variant.base_price
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                variant.id,
                                                                'base_price',
                                                                e.target.value,
                                                            )
                                                        }
                                                        error={
                                                            !!errors[
                                                                `variants.${index}.base_price`
                                                            ]
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `variants.${index}.base_price`
                                                            ]
                                                        }
                                                    />
                                                </div>

                                                {hasMaterialOptions && (
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <Label
                                                                htmlFor={`variant-${index}-customer_price`}
                                                            >
                                                                Customer
                                                                Materials Price
                                                                (₦)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                id={`variant-${index}-customer_price`}
                                                                name={`variants[${index}][customer_materials_price]`}
                                                                placeholder="0.00"
                                                                value={
                                                                    variant.customer_materials_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateVariant(
                                                                        variant.id,
                                                                        'customer_materials_price',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label
                                                                htmlFor={`variant-${index}-shop_price`}
                                                            >
                                                                Shop Materials
                                                                Price (₦)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                id={`variant-${index}-shop_price`}
                                                                name={`variants[${index}][shop_materials_price]`}
                                                                placeholder="0.00"
                                                                value={
                                                                    variant.shop_materials_price
                                                                }
                                                                onChange={(e) =>
                                                                    updateVariant(
                                                                        variant.id,
                                                                        'shop_materials_price',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <Label
                                                        htmlFor={`variant-${index}-duration`}
                                                    >
                                                        Estimated Duration
                                                        (minutes)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        id={`variant-${index}-duration`}
                                                        name={`variants[${index}][estimated_duration_minutes]`}
                                                        placeholder="60"
                                                        value={
                                                            variant.estimated_duration_minutes
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                variant.id,
                                                                'estimated_duration_minutes',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <input
                                                    type="hidden"
                                                    name={`variants[${index}][sort_order]`}
                                                    value={variant.sort_order}
                                                />
                                                <input
                                                    type="hidden"
                                                    name={`variants[${index}][is_active]`}
                                                    value={
                                                        variant.is_active
                                                            ? '1'
                                                            : '0'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addVariant}
                                        className="w-full"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Another Variant
                                    </Button>
                                </div>
                            </Card>

                            {/* Actions */}
                            <div className="flex justify-end gap-4">
                                <Link href={'/services'}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Service'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
