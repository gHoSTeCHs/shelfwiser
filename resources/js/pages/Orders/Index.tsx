import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { OrderListResponse, OrderStats } from '@/types/order';
import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle,
    Clock,
    Eye,
    Package,
    Plus,
    Search,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    orders: OrderListResponse;
    stats: OrderStats;
    order_statuses: Record<string, string>;
    payment_statuses: Record<string, string>;
}

export default function Index({
    orders,
    stats,
    order_statuses,
    payment_statuses,
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');

    const filteredOrders = orders.data.filter((order) => {
        const matchesSearch =
            order.order_number
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            order.customer?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            order.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            !selectedStatus || order.status === selectedStatus;
        const matchesPaymentStatus =
            !selectedPaymentStatus ||
            order.payment_status === selectedPaymentStatus;

        return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            pending: 'warning',
            confirmed: 'info',
            processing: 'brand',
            packed: 'blue',
            shipped: 'purple',
            delivered: 'success',
            cancelled: 'error',
            refunded: 'gray',
        };
        return colors[status] || 'gray';
    };

    const getPaymentStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            unpaid: 'error',
            partial: 'warning',
            paid: 'success',
            refunded: 'gray',
            failed: 'error',
        };
        return colors[status] || 'gray';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title="Orders" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Orders
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage sales orders and track fulfillment
                        </p>
                    </div>
                    <Link href={'/orders/create'}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Order
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                                <ShoppingCart className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Orders
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                                <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Pending
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.pending}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Confirmed
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.confirmed}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Delivered
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.delivered}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <Select
                            options={[
                                { value: '', label: 'All Statuses' },
                                ...Object.entries(order_statuses).map(
                                    ([value, label]) => ({
                                        value,
                                        label,
                                    }),
                                ),
                            ]}
                            placeholder="All Statuses"
                            onChange={(value) => setSelectedStatus(value)}
                            defaultValue=""
                        />
                    </div>
                    <div className="sm:w-48">
                        <Select
                            options={[
                                { value: '', label: 'All Payment Status' },
                                ...Object.entries(payment_statuses).map(
                                    ([value, label]) => ({
                                        value,
                                        label,
                                    }),
                                ),
                            ]}
                            placeholder="All Payment Status"
                            onChange={(value) =>
                                setSelectedPaymentStatus(value)
                            }
                            defaultValue=""
                        />
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No orders found"
                        description={
                            searchTerm ||
                            selectedStatus ||
                            selectedPaymentStatus
                                ? 'Try adjusting your search criteria'
                                : 'Get started by creating your first order'
                        }
                        action={
                            !searchTerm &&
                            !selectedStatus &&
                            !selectedPaymentStatus ? (
                                <Link href={'/orders/create'}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Order
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <Card key={order.id} className="p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {order.order_number}
                                            </h3>
                                            <Badge
                                                variant="light"
                                                color={getStatusColor(
                                                    order.status,
                                                )}
                                            >
                                                {order_statuses[order.status]}
                                            </Badge>
                                            <Badge
                                                variant="light"
                                                color={getPaymentStatusColor(
                                                    order.payment_status,
                                                )}
                                            >
                                                {
                                                    payment_statuses[
                                                        order.payment_status
                                                    ]
                                                }
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                            {order.customer && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Customer:
                                                    </span>
                                                    <span>
                                                        {order.customer.name}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Shop:
                                                </span>
                                                <span>{order.shop?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Items:
                                                </span>
                                                <span>{order.items_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Date:
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        order.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Total Amount
                                            </p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    order.total_amount,
                                                )}
                                            </p>
                                        </div>
                                        <Link href={`/orders/${order.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
