import ServiceController from '@/actions/App/Http/Controllers/ServiceController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import ImageGallery from '@/components/images/ImageGallery';
import ImageUploader from '@/components/images/ImageUploader';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { flattenCategories } from '@/lib/utils';
import { Service, ServiceCategory } from '@/types/service';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Image as ImageIcon, Save } from 'lucide-react';
import { useState } from 'react';

interface Props {
    service: Service;
    categories: ServiceCategory[];
}

export default function Edit({ service, categories }: Props) {
    const [categoryId, setCategoryId] = useState<number | ''>(
        service.service_category_id || '',
    );
    const [serviceName, setServiceName] = useState<string>(service.name);
    const [description, setDescription] = useState<string>(
        service.description || '',
    );
    const [imageUrl, setImageUrl] = useState<string>(service.image_url || '');
    const [hasMaterialOptions, setHasMaterialOptions] = useState<boolean>(
        service.has_material_options,
    );
    const [isActive, setIsActive] = useState<boolean>(service.is_active);
    const [isAvailableOnline, setIsAvailableOnline] = useState<boolean>(
        service.is_available_online,
    );

    const flatCategories = flattenCategories(categories as unknown as import('@/types/product').ProductCategory[]);

    return (
        <>
            <Head title={`Edit ${service.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/services/${service.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Edit Service
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Update service information
                        </p>
                    </div>
                </div>

                <Form
                    action={ServiceController.update.url({
                        service: service.id,
                    })}
                    method="put"
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
                                            defaultValue={
                                                categoryId
                                                    ? categoryId.toString()
                                                    : ''
                                            }
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
                                            name="description"
                                            id="description"
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
                                            onChange={(checked) =>
                                                setHasMaterialOptions(checked)
                                            }
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
                                            onChange={(checked) =>
                                                setIsAvailableOnline(checked)
                                            }
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
                                            onChange={(checked) =>
                                                setIsActive(checked)
                                            }
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

                            {/* Service Images */}
                            <Card>
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <ImageIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Service Images
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Manage service images
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <ImageGallery
                                        images={service.images || []}
                                        modelType="Service"
                                        modelId={service.id}
                                        canManage={true}
                                        showPlaceholder={true}
                                    />

                                    <ImageUploader
                                        modelType="Service"
                                        modelId={service.id}
                                        maxFiles={10}
                                    />
                                </div>
                            </Card>

                            {/* Info about variants */}
                            <Card title="Variants & Add-ons">
                                <div className="bg-info-50 dark:bg-info-900/20 rounded-lg p-4">
                                    <p className="text-info-700 dark:text-info-300 text-sm">
                                        Variants and add-ons can be managed from
                                        the service details page after saving
                                        these changes.
                                    </p>
                                </div>
                            </Card>

                            {/* Actions */}
                            <div className="flex justify-end gap-4">
                                <Link href={`/services/${service.id}`}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
