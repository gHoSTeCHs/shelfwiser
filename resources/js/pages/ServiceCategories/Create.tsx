import ServiceCategoryController from '@/actions/App/Http/Controllers/ServiceCategoryController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { ServiceCategory } from '@/types/service';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface Props {
    parentCategories: ServiceCategory[];
}

export default function Create({ parentCategories }: Props) {
    const [parentId, setParentId] = useState<number | ''>('');
    const [categoryName, setCategoryName] = useState<string>('');
    const [slug, setSlug] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [icon, setIcon] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<string>('0');
    const [isActive, setIsActive] = useState<boolean>(true);

    // Auto-generate slug from name
    const handleNameChange = (value: string) => {
        setCategoryName(value);
        const generatedSlug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        setSlug(generatedSlug);
    };

    return (
        <>
            <Head title="Create Service Category" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/service-categories">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Service Category
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Add a new category to organize your services
                        </p>
                    </div>
                </div>

                <Form
                    action={ServiceCategoryController.store.url()}
                    method="post"
                    transform={(data) => ({
                        ...data,
                        is_active: isActive ? '1' : '0',
                    })}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card title="Category Information">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="parent_id">
                                            Parent Category (Optional)
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'None (Top Level)',
                                                },
                                                ...parentCategories.map(
                                                    (cat) => ({
                                                        value: cat.id.toString(),
                                                        label: cat.name,
                                                    }),
                                                ),
                                            ]}
                                            placeholder="Select parent category"
                                            onChange={(value) =>
                                                setParentId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                )
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="parent_id"
                                            value={parentId}
                                        />
                                        <InputError message={errors.parent_id} />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Create a subcategory by selecting a
                                            parent
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="name">
                                            Category Name{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            name="name"
                                            id="name"
                                            placeholder="e.g., Hair Services, Beauty Treatments"
                                            value={categoryName}
                                            onChange={(e) =>
                                                handleNameChange(e.target.value)
                                            }
                                            error={!!errors.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="slug">
                                            Slug{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            name="slug"
                                            id="slug"
                                            placeholder="hair-services"
                                            value={slug}
                                            onChange={(e) =>
                                                setSlug(e.target.value)
                                            }
                                            error={!!errors.slug}
                                        />
                                        <InputError message={errors.slug} />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            URL-friendly identifier (auto-generated
                                            from name)
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <TextArea
                                            name="description"
                                            id="description"
                                            placeholder="Describe this category..."
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
                                        <Label htmlFor="icon">
                                            Icon (Emoji)
                                        </Label>
                                        <Input
                                            type="text"
                                            name="icon"
                                            id="icon"
                                            placeholder="💇 (optional emoji icon)"
                                            value={icon}
                                            onChange={(e) =>
                                                setIcon(e.target.value)
                                            }
                                            error={!!errors.icon}
                                            maxLength={10}
                                        />
                                        <InputError message={errors.icon} />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Single emoji to represent this category
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="sort_order">
                                            Sort Order
                                        </Label>
                                        <Input
                                            type="number"
                                            name="sort_order"
                                            id="sort_order"
                                            placeholder="0"
                                            value={sortOrder}
                                            onChange={(e) =>
                                                setSortOrder(e.target.value)
                                            }
                                            error={!!errors.sort_order}
                                        />
                                        <InputError message={errors.sort_order} />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Lower numbers appear first
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={isActive}
                                            onChange={(e) =>
                                                setIsActive(e.target.checked)
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

                            {/* Actions */}
                            <div className="flex justify-end gap-4">
                                <Link href="/service-categories">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Category'}
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
