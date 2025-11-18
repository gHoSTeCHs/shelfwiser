import AppLayout from '@/layouts/AppLayout';
import AdminProductTemplateController from '@/actions/App/Http/Controllers/Admin/AdminProductTemplateController';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { ArrowLeft, Edit, Trash2, Package, Box, User, Calendar } from 'lucide-react';

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

interface User {
    id: number;
    name: string;
    email: string;
}

interface PackagingType {
    name: string;
    display_name: string;
    units_per_package: number;
    is_base_unit?: boolean;
    can_break_down?: boolean;
}

interface Variant {
    name: string;
    attributes: Record<string, string>;
    packaging_types: PackagingType[];
}

interface TemplateStructure {
    variants: Variant[];
}

interface ProductTemplate {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    custom_attributes: Record<string, any> | null;
    template_structure: TemplateStructure;
    images: string[] | null;
    seo_metadata: Record<string, string> | null;
    has_variants: boolean;
    is_system: boolean;
    is_active: boolean;
    variant_count: number;
    product_type: ProductType | null;
    category: ProductCategory | null;
    created_by: User | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    template: ProductTemplate;
    usageCount: number;
}

export default function Show({ template, usageCount }: Props) {
    const handleDelete = () => {
        if (usageCount > 0) {
            alert('Cannot delete template that has been used to create products.');
            return;
        }
        if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
            router.delete(AdminProductTemplateController.destroy.url({ product_template: template.id }));
        }
    };

    return (
        <AppLayout>
            <Head title={`Template: ${template.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={AdminProductTemplateController.index.url()}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {template.name}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {template.is_system ? 'System Template' : 'Custom Template'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={AdminProductTemplateController.edit.url({ product_template: template.id })}>
                            <Button variant="outline" startIcon={<Edit className="h-4 w-4" />}>
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            startIcon={<Trash2 className="h-4 w-4" />}
                            onClick={handleDelete}
                            disabled={usageCount > 0}
                        >
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Basic Information
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-white">{template.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-white font-mono text-sm">{template.slug}</dd>
                                </div>
                                {template.description && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-white">{template.description}</dd>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Type</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-white">
                                            {template.product_type?.label || '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-white">
                                            {template.category?.name || '-'}
                                        </dd>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                                        <dd className="mt-1">
                                            <Badge color={template.is_active ? 'success' : 'error'}>
                                                {template.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Has Variants</dt>
                                        <dd className="mt-1">
                                            <Badge color={template.has_variants ? 'primary' : 'light'}>
                                                {template.has_variants ? 'Yes' : 'No'}
                                            </Badge>
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </Card>

                        {/* Variants Structure */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Variants Structure ({template.variant_count} variants)
                            </h2>
                            <div className="space-y-4">
                                {template.template_structure.variants.map((variant, index) => (
                                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Package className="h-4 w-4 text-primary-500" />
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {variant.name}
                                            </h3>
                                        </div>

                                        {Object.keys(variant.attributes || {}).length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Attributes</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(variant.attributes).map(([key, value]) => (
                                                        <span
                                                            key={key}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                        >
                                                            {key}: {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {variant.packaging_types && variant.packaging_types.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Packaging Types</p>
                                                <div className="space-y-2">
                                                    {variant.packaging_types.map((pkg, pkgIndex) => (
                                                        <div
                                                            key={pkgIndex}
                                                            className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded px-3 py-2"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Box className="h-3 w-3 text-gray-400" />
                                                                <span className="text-gray-900 dark:text-white">
                                                                    {pkg.display_name}
                                                                </span>
                                                                {pkg.is_base_unit && (
                                                                    <Badge color="primary" size="sm">Base</Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                {pkg.units_per_package} unit{pkg.units_per_package !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Custom Attributes */}
                        {template.custom_attributes && Object.keys(template.custom_attributes).length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Custom Attributes
                                </h2>
                                <dl className="grid grid-cols-2 gap-4">
                                    {Object.entries(template.custom_attributes).map(([key, value]) => (
                                        <div key={key}>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </dt>
                                            <dd className="mt-1 text-gray-900 dark:text-white">
                                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Usage Statistics
                            </h2>
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                                    {usageCount}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Products created from this template
                                </p>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Metadata
                            </h2>
                            <dl className="space-y-3">
                                {template.created_by && (
                                    <div className="flex items-start gap-2">
                                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-gray-500 dark:text-gray-400">Created by</dt>
                                            <dd className="text-sm text-gray-900 dark:text-white">
                                                {template.created_by.name}
                                            </dd>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <dt className="text-xs text-gray-500 dark:text-gray-400">Created at</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">
                                            {new Date(template.created_at).toLocaleDateString()}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <dt className="text-xs text-gray-500 dark:text-gray-400">Last updated</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">
                                            {new Date(template.updated_at).toLocaleDateString()}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
