import ProductCategoryController from '@/actions/App/Http/Controllers/ProductCategoryController';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Edit,
    FolderTree,
    Package,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
    children: Category[];
}

interface Props {
    categories: Category[];
}

function CategoryTreeItem({
    category,
    level = 0,
}: {
    category: Category;
    level?: number;
}) {
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();
    const [isExpanded, setIsExpanded] = useState(level === 0);
    const hasChildren = category.children && category.children.length > 0;

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category? This action cannot be undone.',
            variant: 'danger',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
        });
        if (!confirmed) return;

        router.delete(ProductCategoryController.destroy.url({ category: category.id }));
    };

    return (
        <div className="border-l-2 border-gray-200 dark:border-gray-700">
            <div
                className={`group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    level > 0 ? 'ml-6' : ''
                }`}
            >
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                ) : (
                    <div className="h-6 w-6" />
                )}

                <div className="flex flex-1 items-center gap-3">
                    <FolderTree className="h-5 w-5 text-brand-500" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href={ProductCategoryController.show.url({
                                    category: category.id,
                                })}
                                className="font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                            >
                                {category.name}
                            </Link>
                            {category.products_count > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    <Package className="h-3 w-3" />
                                    {category.products_count}
                                </span>
                            )}
                        </div>
                        {category.description && (
                            <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
                                {category.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                        href={ProductCategoryController.edit.url({
                            category: category.id,
                        })}
                    >
                        <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="ml-3">
                    {category.children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            category={child}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialogComponent />
        </div>
    );
}

export default function Index({ categories }: Props) {
    return (
        <>
            <Head title="Product Categories" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Product Categories
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Organize your products into categories and
                            subcategories
                        </p>
                    </div>
                    <Link href={ProductCategoryController.create.url()}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                        </Button>
                    </Link>
                </div>

                {categories.length === 0 ? (
                    <EmptyState
                        icon={<FolderTree className="h-12 w-12" />}
                        title="No categories yet"
                        description="Get started by creating your first product category"
                        action={
                            <Link href={ProductCategoryController.create.url()}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Category
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <Card>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map((category) => (
                                <CategoryTreeItem
                                    key={category.id}
                                    category={category}
                                />
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
