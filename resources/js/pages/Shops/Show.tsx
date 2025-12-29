import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import { User } from '@/types';
import { Shop } from '@/types/shop';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Calendar,
    ChevronLeft,
    ClipboardList,
    Code,
    Edit,
    Mail,
    MapPin,
    Package,
    Phone,
    Settings,
    Store,
    TrendingUp,
    Users,
} from 'lucide-react';

interface Props {
    shop: Shop;
    auth: { user: User };
    can_manage: boolean;
}

export default function ShopsShow({ shop, can_manage }: Props) {
    console.log(shop, can_manage);

    return (
        <>
            <Head title={`${shop.name} - Shop Details`} />

            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={'/shops'}
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Shops
                        </Link>
                    </div>

                    {can_manage && (
                        <Link href={`/shops/${shop.id}/edit`}>
                            <Button size="sm" className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Shop
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {shop.name}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <Badge
                                variant="light"
                                color={shop.is_active ? 'success' : 'error'}
                            >
                                {shop.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Slug: {shop.slug}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Shop Information">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <Building2 className="h-5 w-5" />
                                    Shop Information
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Shop Name
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {shop.name}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Shop Slug
                                        </label>
                                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                            <Code className="h-4 w-4" />
                                            {shop.slug}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Business Type
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {shop.type.label || 'Not specified'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Status
                                        </label>
                                        <div className="mt-1">
                                            <Badge
                                                variant="light"
                                                color={
                                                    shop.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                            >
                                                {shop.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Location Details">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <MapPin className="h-5 w-5" />
                                    Location Details
                                </h2>

                                <div className="space-y-3">
                                    {shop.address && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Address
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {shop.address}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {shop.city && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    City
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {shop.city}
                                                </p>
                                            </div>
                                        )}

                                        {shop.state && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    State
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {shop.state}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {shop.country && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Country
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {shop.country}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card title="Contact Information">
                            <div className="p-6">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Contact Information
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {shop.phone && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Phone Number
                                            </label>
                                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                <Phone className="h-4 w-4" />
                                                <a
                                                    href={`tel:${shop.phone}`}
                                                    className="hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    {shop.phone}
                                                </a>
                                            </p>
                                        </div>
                                    )}

                                    {shop.email && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Email Address
                                            </label>
                                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                <Mail className="h-4 w-4" />
                                                <a
                                                    href={`mailto:${shop.email}`}
                                                    className="hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    {shop.email}
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Quick Stats">
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Quick Stats
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                Staff Members
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {shop.users_count}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                Products
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {shop.products_count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Timeline">
                            <div className="p-6">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <Calendar className="h-5 w-5" />
                                    Timeline
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Created
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(
                                                shop.created_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Last Updated
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(
                                                shop.updated_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-3">
                            {can_manage && (
                                <>
                                    <Link href={`/shops/${shop.id}/settings`}>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Shop Settings
                                        </Button>
                                    </Link>

                                    <Link
                                        href={`/shops/${shop.id}/storefront-settings`}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <Store className="h-4 w-4" />
                                            Storefront Settings
                                        </Button>
                                    </Link>
                                </>
                            )}

                            <Link href={`/shops/${shop.id}/products`}>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                >
                                    <Package className="h-4 w-4" />
                                    View Products
                                </Button>
                            </Link>

                            {can_manage && (
                                <>
                                    <Link href={`/shops/${shop.id}/stock-take`}>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            Stock Take
                                        </Button>
                                    </Link>

                                    <Link
                                        href={`/shops/${shop.id}/reorder-alerts`}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <AlertTriangle className="h-4 w-4" />
                                            Reorder Alerts
                                        </Button>
                                    </Link>
                                </>
                            )}

                            <Link href={`/shops/${shop.id}/reports`}>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    View Reports
                                </Button>
                            </Link>

                            {can_manage && (
                                <Link href={`/shops/${shop.id}/tax-settings`}>
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Tax Settings
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ShopsShow.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
