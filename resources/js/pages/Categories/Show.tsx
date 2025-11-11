import ProductCategoryController from '@/actions/App/Http/Controllers/ProductCategoryController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    Edit,
    FolderTree,
    Package,
    Tag,
    Trash2,
} from 'lucide-react';

interface ProductType {
    id: number;
    slug: string;
    label: string;
}

interface Shop {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    type: ProductType;
    shop: Shop;
    created_at: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    parent: Category | null;
    children: Array<{
        id: number;
        name: string;
        slug: string;
        products_count: number;
    }>;
    products: Product[];
    products_count: number;
}

interface Breadcrumb {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    category: Category;
    breadcrumbs: Breadcrumb[];
}

export default function Show({ category, breadcrumbs }: Props) {
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout>
            <Head title={category.name} />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={ProductCategoryController.index.url()}
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Categories
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={ProductCategoryController.edit.url({
                                category: category.id,
                            })}
                        >
                            <Button size="sm" variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Link
                            href={ProductCategoryController.destroy.url({
                                category: category.id,
                            })}
                            method="delete"
                            as="button"
                            onBefore={() =>
                                confirm(
                                    'Are you sure you want to delete this category? This action cannot be undone.'
                                )
                            }
                        >
                            <Button size="sm" variant="outline" className="text-error-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </Link>
                    </div>
                </div>

                {breadcrumbs.length > 1 && (
                    <nav className="flex items-center gap-2 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id} className="flex items-center gap-2">
                                {index > 0 && (
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                                <Link
                                    href={ProductCategoryController.show.url({
                                        category: crumb.id,
                                    })}
                                    className={`${
                                        index === breadcrumbs.length - 1
                                            ? 'font-medium text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {crumb.name}
                                </Link>
                            </div>
                        ))}
                    </nav>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {category.name}
                        </h1>
                        <div className="mt-2 flex items-center gap-3">
                            <Badge
                                variant="light"
                                color={category.is_active ? 'success' : 'error'}
                            >
                                {category.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {category.products_count}{' '}
                                {category.products_count === 1 ? 'product' : 'products'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {category.description && (
                            <Card title="Description">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {category.description}
                                </p>
                            </Card>
                        )}

                        {category.children.length > 0 && (
                            <Card title="Subcategories">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {category.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={ProductCategoryController.show.url({
                                                category: child.id,
                                            })}
                                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-brand-700"
                                        >
                                            <FolderTree className="h-5 w-5 text-brand-500" />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {child.name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {child.products_count}{' '}
                                                    {child.products_count === 1
                                                        ? 'product'
                                                        : 'products'}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {category.products.length > 0 && (
                            <Card title="Recent Products">
                                <div className="space-y-3">
                                    {category.products.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={ProductController.show.url({
                                                product: product.id,
                                            })}
                                            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-brand-700"
                                        >
                                            <Package className="h-5 w-5 text-brand-500" />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {product.name}
                                                </p>
                                                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        {product.type.label}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {product.shop.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </Link>
                                    ))}
                                    {category.products_count > category.products.length && (
                                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                            And {category.products_count - category.products.length}{' '}
                                            more products...
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card title="Category Info">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Slug
                                    </p>
                                    <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                                        {category.slug}
                                    </p>
                                </div>

                                {category.parent && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Parent Category
                                        </p>
                                        <Link
                                            href={ProductCategoryController.show.url({
                                                category: category.parent.id,
                                            })}
                                            className="mt-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                        >
                                            {category.parent.name}
                                        </Link>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Subcategories
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                        {category.children.length}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Products
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                        {category.products_count}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
