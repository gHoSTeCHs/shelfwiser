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
import { ArrowLeft, FolderTree, Save } from 'lucide-react';

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
    const flattenCategories = (categories: Category[], level = 0): Array<{ id: number; name: string; level: number }> => {
        let result: Array<{ id: number; name: string; level: number }> = [];

        categories.forEach((category) => {
            result.push({
                id: category.id,
                name: category.name,
                level,
            });

            if (category.children && category.children.length > 0) {
                result = result.concat(flattenCategories(category.children, level + 1));
            }
        });

        return result;
    };

    const flatCategories = flattenCategories(parentCategories);

    return (
        <AppLayout>
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
                    <Card>
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="name">
                                    Category Name <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="e.g., Electronics, Clothing, Furniture"
                                />
                                <InputError message="" />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    placeholder="Describe what products belong in this category..."
                                />
                                <InputError message="" />
                            </div>

                            <div>
                                <Label htmlFor="parent_id">
                                    Parent Category (Optional)
                                </Label>
                                <Select
                                    name="parent_id"
                                    id="parent_id"
                                >
                                    <option value="">None (Top Level Category)</option>
                                    {flatCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {'—'.repeat(category.level)} {category.name}
                                        </option>
                                    ))}
                                </Select>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Select a parent to create a subcategory
                                </p>
                                <InputError message="" />
                            </div>

                            <div>
                                <Label htmlFor="is_active" className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_active"
                                        name="is_active"
                                        defaultChecked={true}
                                    />
                                    <span>Active</span>
                                </Label>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Inactive categories won't appear in product forms
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Link href={ProductCategoryController.index.url()}>
                            <Button
                                type="button"
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Create Category
                        </Button>
                    </div>
                </Form>
            </div>
        </AppLayout>
    );
}
