import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Search, LayoutTemplate, Eye, Edit, Trash2, Package } from 'lucide-react';
import { useState } from 'react';

interface ProductType {
    id: number;
    label: string;
    slug: string;
}

interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

interface ProductTemplate {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    product_type: ProductType | null;
    category: ProductCategory | null;
    has_variants: boolean;
    is_active: boolean;
    variant_count: number;
    usage_count: number;
    created_at: string;
}

interface Statistics {
    total: number;
    active: number;
    total_usage: number;
}

interface Props {
    templates: {
        data: ProductTemplate[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    productTypes: ProductType[];
    categories: ProductCategory[];
    filters: {
        search?: string;
        product_type_id?: string;
        category_id?: string;
        sort?: string;
        direction?: string;
    };
    statistics: Statistics;
}

export default function Index({ templates, productTypes, categories, filters, statistics }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/product-templates', { ...filters, search }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (!value) delete newFilters[key as keyof typeof newFilters];
        router.get('/admin/product-templates', newFilters, { preserveState: true });
    };

    const handleDelete = (template: ProductTemplate) => {
        if (template.usage_count > 0) {
            alert('Cannot delete template that has been used to create products.');
            return;
        }
        if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
            router.delete(`/admin/product-templates/${template.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Product Templates" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Product Templates
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage system-wide product templates for quick product creation
                        </p>
                    </div>
                    <Link href="/admin/product-templates/create">
                        <Button startIcon={<Plus className="h-4 w-4" />}>
                            Create Template
                        </Button>
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900">
                                <LayoutTemplate className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Templates</p>
                                <p className="text-xl font-semibold text-gray-900 dark:text-white">{statistics.total}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900">
                                <Package className="h-5 w-5 text-success-600 dark:text-success-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active Templates</p>
                                <p className="text-xl font-semibold text-gray-900 dark:text-white">{statistics.active}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-info-100 p-2 dark:bg-info-900">
                                <Package className="h-5 w-5 text-info-600 dark:text-info-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Products Created</p>
                                <p className="text-xl font-semibold text-gray-900 dark:text-white">{statistics.total_usage}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </form>
                        <div className="flex gap-2">
                            <Select
                                options={[
                                    { value: '', label: 'All Types' },
                                    ...productTypes.map(type => ({
                                        value: type.id.toString(),
                                        label: type.label,
                                    })),
                                ]}
                                defaultValue={filters.product_type_id || ''}
                                onChange={(value) => handleFilterChange('product_type_id', value)}
                            />
                            <Select
                                options={[
                                    { value: '', label: 'All Categories' },
                                    ...categories.map(cat => ({
                                        value: cat.id.toString(),
                                        label: cat.name,
                                    })),
                                ]}
                                defaultValue={filters.category_id || ''}
                                onChange={(value) => handleFilterChange('category_id', value)}
                            />
                        </div>
                    </div>
                </Card>

                {templates.data.length === 0 ? (
                    <EmptyState
                        icon={<LayoutTemplate className="h-12 w-12" />}
                        title="No templates found"
                        description="Get started by creating your first product template."
                        action={
                            <Link href="/admin/product-templates/create">
                                <Button startIcon={<Plus className="h-4 w-4" />}>
                                    Create Template
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Template
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Variants
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Usage
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                    {templates.data.map((template) => (
                                        <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <Link
                                                        href={`/admin/product-templates/${template.id}`}
                                                        className="font-medium text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                                                    >
                                                        {template.name}
                                                    </Link>
                                                    {template.description && (
                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                            {template.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {template.product_type?.label || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {template.category?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {template.variant_count}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {template.usage_count} products
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={template.is_active ? 'success' : 'error'}>
                                                    {template.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/product-templates/${template.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/product-templates/${template.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(template)}
                                                        disabled={template.usage_count > 0}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-error-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {templates.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing page {templates.current_page} of {templates.last_page} ({templates.total} total)
                                </div>
                                <div className="flex gap-1">
                                    {templates.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-primary-600 text-white'
                                                    : link.url
                                                    ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                                    : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
