import AppLayout from '@/layouts/AppLayout';
import { Head, Form } from '@inertiajs/react';
import {
    Server,
    Database,
    HardDrive,
    Users,
    Package,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import AdminSettingsController from '@/actions/App/Http/Controllers/Admin/AdminSettingsController';

interface Props {
    settings: {
        app_name: string;
        app_url: string;
        app_env: string;
        app_debug: boolean;
        maintenance_mode: boolean;
        cache_driver: string;
        queue_driver: string;
        mail_driver: string;
        timezone: string;
        locale: string;
    };
    stats: {
        total_tenants: number;
        total_users: number;
        total_products: number;
        total_orders: number;
        cache_size: string;
        storage_used: string;
    };
}

export default function Index({ settings, stats }: Props) {
    return (
        <>
            <Head title="System Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        System Settings
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure platform-wide settings and monitor system health
                    </p>
                </div>

                {/* System Stats */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card className="p-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_tenants}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Tenants
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_users}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Users
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_products}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Products
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                                <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_orders}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Orders
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                                <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.cache_size}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Cache
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                                <HardDrive className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.storage_used}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Storage
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* System Information */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                    <Server className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Application Settings
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Core application configuration
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Application Name
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {settings.app_name}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Environment
                                    </span>
                                    <Badge
                                        variant="light"
                                        color={
                                            settings.app_env === 'production'
                                                ? 'success'
                                                : 'warning'
                                        }
                                    >
                                        {settings.app_env}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Debug Mode
                                    </span>
                                    <Badge
                                        variant="light"
                                        color={
                                            settings.app_debug ? 'error' : 'success'
                                        }
                                    >
                                        {settings.app_debug ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Timezone
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {settings.timezone}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Locale
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {settings.locale}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                    <Database className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Infrastructure
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Cache, queue, and mail configuration
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Cache Driver
                                    </span>
                                    <Badge variant="light" color="info">
                                        {settings.cache_driver}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Queue Driver
                                    </span>
                                    <Badge variant="light" color="info">
                                        {settings.queue_driver}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Mail Driver
                                    </span>
                                    <Badge variant="light" color="info">
                                        {settings.mail_driver}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Maintenance Mode
                                    </span>
                                    <Badge
                                        variant="light"
                                        color={
                                            settings.maintenance_mode
                                                ? 'warning'
                                                : 'success'
                                        }
                                    >
                                        {settings.maintenance_mode
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* System Actions */}
                <Card>
                    <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            System Actions
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Perform maintenance and optimization tasks
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Form
                                action={AdminSettingsController.clearCache.url()}
                                method="post"
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                        loading={processing}
                                        className="w-full"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Clear Application Cache
                                    </Button>
                                )}
                            </Form>

                            <Button variant="outline" disabled className="w-full">
                                <Database className="mr-2 h-4 w-4" />
                                Optimize Database
                                <Badge variant="light" color="info" className="ml-2">
                                    Coming Soon
                                </Badge>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
