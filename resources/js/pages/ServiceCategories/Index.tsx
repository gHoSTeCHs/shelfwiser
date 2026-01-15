import ServiceCategoryController from '@/actions/App/Http/Controllers/ServiceCategoryController';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { ServiceCategory } from '@/types/service';
import { Form, Head, Link } from '@inertiajs/react';
import { Edit, Folder, Plus, Sparkles, Trash2 } from 'lucide-react';

interface Props {
    categories: ServiceCategory[];
}

export default function Index({ categories }: Props) {
    return (
        <>
            <Head title="Service Categories" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Service Categories
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Organize your services into categories
                        </p>
                    </div>
                    <Link href={'/service-categories/create'}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                        </Button>
                    </Link>
                </div>

                {categories.length === 0 ? (
                    <EmptyState
                        icon={<Folder className="h-12 w-12" />}
                        title="No categories found"
                        description="Get started by creating your first service category"
                        action={
                            <Link href={'/service-categories/create'}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Category
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <Card key={category.id}>
                                <div className="space-y-4">
                                    {/* Category Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/20">
                                                {category.icon ? (
                                                    <span className="text-xl">
                                                        {category.icon}
                                                    </span>
                                                ) : (
                                                    <Folder className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {category.name}
                                                </h3>
                                                {category.description && (
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                        {category.description}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            category.is_active
                                                                ? 'light'
                                                                : 'solid'
                                                        }
                                                        color={
                                                            category.is_active
                                                                ? 'success'
                                                                : 'error'
                                                        }
                                                        size="sm"
                                                    >
                                                        {category.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                    <Badge
                                                        variant="light"
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        <Sparkles className="mr-1 h-3 w-3" />
                                                        {category.services_count ||
                                                            0}{' '}
                                                        services
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/service-categories/${category.id}/edit`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Form
                                                action={ServiceCategoryController.destroy.url(
                                                    {
                                                        service_category:
                                                            category.id,
                                                    },
                                                )}
                                                method="delete"
                                                onSubmit={(e) => {
                                                    if (
                                                        !confirm(
                                                            `Are you sure you want to delete "${category.name}"? This will affect ${category.services_count || 0} services.`,
                                                        )
                                                    ) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </Form>
                                        </div>
                                    </div>

                                    {/* Subcategories */}
                                    {category.children &&
                                        category.children.length > 0 && (
                                            <div className="ml-12 space-y-2 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
                                                {category.children.map(
                                                    (child) => (
                                                        <div
                                                            key={child.id}
                                                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {child.icon && (
                                                                    <span>
                                                                        {
                                                                            child.icon
                                                                        }
                                                                    </span>
                                                                )}
                                                                <span className="font-medium text-gray-900 dark:text-white">
                                                                    {child.name}
                                                                </span>
                                                                <Badge
                                                                    variant="light"
                                                                    color={
                                                                        child.is_active
                                                                            ? 'success'
                                                                            : 'error'
                                                                    }
                                                                    size="sm"
                                                                >
                                                                    {child.is_active
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </Badge>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Link
                                                                    href={`/service-categories/${child.id}/edit`}
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Form
                                                                    action={ServiceCategoryController.destroy.url(
                                                                        {
                                                                            service_category:
                                                                                child.id,
                                                                        },
                                                                    )}
                                                                    method="delete"
                                                                    onSubmit={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            !confirm(
                                                                                `Are you sure you want to delete "${child.name}"?`,
                                                                            )
                                                                        ) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                >
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </Form>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
