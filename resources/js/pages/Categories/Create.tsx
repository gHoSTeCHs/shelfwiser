import ProductCategoryController from '@/actions/App/Http/Controllers/ProductCategoryController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
    children?: Category[];
}

interface Props {
    parentCategories: Category[];
}

export default function Create({ parentCategories }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState('');
    const [isActive, setIsActive] = useState(true);

    const flattenCategories = (
        categories: Category[],
        level = 0,
    ): Array<{
        id: number;
        name: string;
        level: number;
    }> => {
        let result: Array<{ id: number; name: string; level: number }> = [];

        categories.forEach((category) => {
            result.push({
                id: category.id,
                name: category.name,
                level,
            });

            if (category.children && category.children.length > 0) {
                result = result.concat(
                    flattenCategories(category.children, level + 1),
                );
            }
        });

        return result;
    };

    const flatCategories = flattenCategories(parentCategories);

    // Convert flat categories to options for Select component
    const parentCategoryOptions = [
        { value: '', label: 'None (Top Level Category)' },
        ...flatCategories.map((category) => ({
            value: category.id.toString(),
            label: `${'—'.repeat(category.level)} ${category.name}`,
        })),
    ];

    return (
        <>
            <Head title="Create Category" />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={ProductCategoryController.index.url()}
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Categories
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Create Category
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Add a new product category to organize your inventory
                    </p>
                </div>

                <Form
                    action={ProductCategoryController.store.url()}
                    method="post"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="name">
                                            Category Name{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            error={!!errors.name}
                                            placeholder="e.g., Electronics, Clothing, Furniture"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <TextArea
                                            id="description"
                                            value={description}
                                            onChange={(value) =>
                                                setDescription(value)
                                            }
                                            rows={4}
                                            placeholder="Describe what products belong in this category..."
                                            error={!!errors.description}
                                        />
                                        {/* Hidden input to submit the value */}
                                        <input
                                            type="hidden"
                                            name="description"
                                            value={description}
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="parent_id">
                                            Parent Category (Optional)
                                        </Label>
                                        <Select
                                            options={parentCategoryOptions}
                                            placeholder="None (Top Level Category)"
                                            onChange={(value) =>
                                                setParentId(value)
                                            }
                                            defaultValue={parentId}
                                        />
                                        {/* Hidden input to submit the value */}
                                        <input
                                            type="hidden"
                                            name="parent_id"
                                            value={parentId}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Select a parent to create a
                                            subcategory
                                        </p>
                                        <InputError
                                            message={errors.parent_id}
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="is_active"
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id="is_active"
                                                name="is_active"
                                                checked={isActive}
                                                onChange={(checked) =>
                                                    setIsActive(checked)
                                                }
                                            />
                                            {/* Hidden input to submit the value */}
                                            <input
                                                type="hidden"
                                                name="is_active"
                                                value={isActive ? '1' : '0'}
                                            />
                                            <span>Active</span>
                                        </Label>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Inactive categories won't appear in
                                            product forms
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <div className="mt-4 flex items-center justify-end gap-3">
                                <Link
                                    href={ProductCategoryController.index.url()}
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Save className="mr-2 h-4 w-4 animate-pulse" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Create Category
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
