import ServiceController from '@/actions/App/Http/Controllers/ServiceController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Service, ServiceAddon } from '@/types/service';
import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Clock,
    DollarSign,
    Edit,
    Globe,
    Package2,
    Plus,
    Settings,
    Sparkles,
    Tag,
    Trash2,
} from 'lucide-react';

interface Props {
    service: Service;
    category_addons: ServiceAddon[];
    can_manage: boolean;
}

export default function Show({ service, category_addons, can_manage }: Props) {
    return (
        <AppLayout>
            <Head title={service.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Link href="/services">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {service.name}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {service.slug}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {can_manage && (
                            <>
                                <Link href={`/services/${service.id}/edit`}>
                                    <Button variant="outline">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Form
                                    action={ServiceController.destroy.url({
                                        service: service.id,
                                    })}
                                    method="delete"
                                    onSubmit={(e) => {
                                        if (
                                            !confirm(
                                                'Are you sure you want to delete this service? This action cannot be undone.',
                                            )
                                        ) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </Form>
                            </>
                        )}
                    </div>
                </div>

                {/* Service Details */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card title="Service Information">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        variant={
                                            service.is_active ? 'light' : 'solid'
                                        }
                                        color={
                                            service.is_active
                                                ? 'success'
                                                : 'error'
                                        }
                                    >
                                        {service.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                    {service.is_available_online && (
                                        <Badge variant="light" color="info">
                                            <Globe className="mr-1 h-3 w-3" />
                                            Online Booking
                                        </Badge>
                                    )}
                                    {service.has_material_options && (
                                        <Badge variant="light" color="warning">
                                            <Package2 className="mr-1 h-3 w-3" />
                                            Material Options
                                        </Badge>
                                    )}
                                </div>

                                {service.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Description
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {service.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {service.category && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Tag className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Category:
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {service.category.name}
                                            </span>
                                        </div>
                                    )}

                                    {service.shop && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Shop:
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {service.shop.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {service.image_url && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Service Image
                                        </h3>
                                        <img
                                            src={service.image_url}
                                            alt={service.name}
                                            className="h-48 w-full rounded-lg object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div>
                        <Card title="Quick Stats">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Variants
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                        {service.variants?.length || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-success-50 p-3 dark:bg-success-900/20">
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-success-600 dark:text-success-400" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Add-ons
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold text-success-600 dark:text-success-400">
                                        {service.addons?.length || 0}
                                    </span>
                                </div>

                                {service.variants &&
                                    service.variants.length > 0 && (
                                        <div className="rounded-lg bg-info-50 p-3 dark:bg-info-900/20">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-info-600 dark:text-info-400" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Starting Price
                                                </span>
                                            </div>
                                            <p className="mt-1 text-lg font-bold text-info-600 dark:text-info-400">
                                                ₦
                                                {Math.min(
                                                    ...service.variants.map((v) =>
                                                        parseFloat(
                                                            v.base_price.toString(),
                                                        ),
                                                    ),
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Service Variants */}
                {service.variants && service.variants.length > 0 && (
                    <Card
                        title="Service Variants"
                        description="Different options available for this service"
                    >
                        <div className="space-y-4">
                            {service.variants.map((variant) => (
                                <div
                                    key={variant.id}
                                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {variant.name}
                                                </h4>
                                                {variant.is_active ? (
                                                    <Badge
                                                        variant="light"
                                                        color="success"
                                                        size="sm"
                                                    >
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="light"
                                                        color="error"
                                                        size="sm"
                                                    >
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                            {variant.description && (
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    {variant.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Base Price
                                            </p>
                                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                ₦
                                                {parseFloat(
                                                    variant.base_price.toString(),
                                                ).toLocaleString()}
                                            </p>
                                        </div>

                                        {service.has_material_options &&
                                            variant.customer_materials_price && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Customer Materials
                                                    </p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                        ₦
                                                        {parseFloat(
                                                            variant.customer_materials_price.toString(),
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}

                                        {service.has_material_options &&
                                            variant.shop_materials_price && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Shop Materials
                                                    </p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                        ₦
                                                        {parseFloat(
                                                            variant.shop_materials_price.toString(),
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}

                                        {variant.estimated_duration_minutes && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Duration
                                                </p>
                                                <p className="mt-1 flex items-center font-semibold text-gray-900 dark:text-white">
                                                    <Clock className="mr-1 h-4 w-4" />
                                                    {
                                                        variant.estimated_duration_minutes
                                                    }{' '}
                                                    min
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Service Addons */}
                {(service.addons && service.addons.length > 0) ||
                (category_addons && category_addons.length > 0) ? (
                    <Card
                        title="Add-ons"
                        description="Optional extras for this service"
                    >
                        <div className="space-y-6">
                            {service.addons && service.addons.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Service-Specific Add-ons
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {service.addons.map((addon) => (
                                            <div
                                                key={addon.id}
                                                className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                                            {addon.name}
                                                        </h5>
                                                        {addon.description && (
                                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                {
                                                                    addon.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        ₦
                                                        {parseFloat(
                                                            addon.price.toString(),
                                                        ).toLocaleString()}
                                                    </span>
                                                    {addon.allows_quantity && (
                                                        <Badge
                                                            variant="light"
                                                            color="info"
                                                            size="sm"
                                                        >
                                                            Qty: 1-
                                                            {addon.max_quantity ||
                                                                '∞'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {category_addons && category_addons.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Category-Wide Add-ons
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {category_addons.map((addon) => (
                                            <div
                                                key={addon.id}
                                                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                                            {addon.name}
                                                        </h5>
                                                        {addon.description && (
                                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                {
                                                                    addon.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        ₦
                                                        {parseFloat(
                                                            addon.price.toString(),
                                                        ).toLocaleString()}
                                                    </span>
                                                    {addon.allows_quantity && (
                                                        <Badge
                                                            variant="light"
                                                            color="info"
                                                            size="sm"
                                                        >
                                                            Qty: 1-
                                                            {addon.max_quantity ||
                                                                '∞'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                ) : null}
            </div>
        </AppLayout>
    );
}
