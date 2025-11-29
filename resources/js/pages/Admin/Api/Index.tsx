import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Key, Activity, Zap, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';

interface Props {
    apiKeys: any[];
    stats: {
        total_api_keys: number;
        active_keys: number;
        total_requests_today: number;
        total_requests_month: number;
    };
    webhooks: any[];
    rateLimits: {
        default: string;
        authenticated: string;
    };
}

export default function Index({ apiKeys, stats, webhooks, rateLimits }: Props) {
    return (
        <AppLayout>
            <Head title="API Management" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        API Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage API keys, webhooks, and rate limits
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total API Keys
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_api_keys}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Active Keys
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.active_keys}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Requests Today
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_requests_today.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Requests This Month
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_requests_month.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                                <Globe className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* API Status */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Rate Limits */}
                    <Card>
                        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Rate Limits
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Current API rate limit configuration
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Default (Unauthenticated)
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Public API endpoints
                                        </p>
                                    </div>
                                    <Badge variant="light" color="info">
                                        {rateLimits.default}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Authenticated
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Authenticated API requests
                                        </p>
                                    </div>
                                    <Badge variant="light" color="success">
                                        {rateLimits.authenticated}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* API Documentation */}
                    <Card>
                        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                API Documentation
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Resources and guides
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <a
                                    href="/docs/api"
                                    className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        API Reference
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Complete API endpoint documentation
                                    </p>
                                </a>

                                <a
                                    href="/docs/webhooks"
                                    className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Webhook Guide
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Set up and manage webhooks
                                    </p>
                                </a>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Coming Soon Notice */}
                <Card className="p-12 text-center">
                    <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                            <Key className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                            API Management Coming Soon
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Full API key management, webhook configuration, and
                            analytics will be available in the next update.
                        </p>
                        <div className="mt-4">
                            <Badge variant="light" color="info">
                                In Development
                            </Badge>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
