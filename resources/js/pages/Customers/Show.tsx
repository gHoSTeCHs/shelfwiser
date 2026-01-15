import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import type { CustomerShowPageProps } from '@/types/customer';
import { formatCurrency, getAvailableCredit } from '@/types/customer';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    CreditCard,
    Edit,
    Mail,
    MapPin,
    Phone,
    ShoppingCart,
    User as UserIcon,
    Wallet,
} from 'lucide-react';
import React from 'react';

export default function Show({
    customer,
    recentOrders,
    canManageCredit,
}: CustomerShowPageProps) {
    const availableCredit = getAvailableCredit(customer);

    const handleToggleStatus = () => {
        if (
            confirm(
                `Are you sure you want to ${customer.is_active ? 'deactivate' : 'activate'} this customer?`,
            )
        ) {
            router.patch(
                CustomerController.toggleStatus.url({ customer: customer.id }),
            );
        }
    };

    return (
        <>
            <Head title={`${customer.full_name} - Customer Details`} />

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={CustomerController.index.url()}
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Customers
                        </Link>
                    </div>

                    <Link
                        href={CustomerController.edit.url({
                            customer: customer.id,
                        })}
                    >
                        <Button size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Customer
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                            <span className="text-xl font-bold">
                                {customer.first_name[0]}
                                {customer.last_name[0]}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {customer.full_name}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                <Badge
                                    variant="light"
                                    color={
                                        customer.is_active ? 'success' : 'error'
                                    }
                                >
                                    {customer.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {customer.credit_limit && (
                                    <Badge variant="light" color="info">
                                        Credit Account
                                    </Badge>
                                )}
                                {customer.marketing_opt_in && (
                                    <Badge variant="light" color="warning">
                                        Marketing Opted In
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Personal Information">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <UserIcon className="h-5 w-5" />
                                    Personal Information
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            First Name
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {customer.first_name}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Last Name
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {customer.last_name}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Email Address
                                        </label>
                                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                            <Mail className="h-4 w-4" />
                                            <a
                                                href={`mailto:${customer.email}`}
                                                className="hover:text-blue-600 dark:hover:text-blue-400"
                                            >
                                                {customer.email}
                                            </a>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Phone
                                        </label>
                                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                            <Phone className="h-4 w-4" />
                                            {customer.phone || 'Not provided'}
                                        </p>
                                    </div>

                                    {customer.preferred_shop && (
                                        <div className="sm:col-span-2">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Preferred Shop
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {customer.preferred_shop.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card title="Credit Summary">
                            <div className="p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <CreditCard className="h-5 w-5" />
                                    Credit Summary
                                </h2>

                                {customer.credit_limit ? (
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Current Balance
                                            </label>
                                            <p
                                                className={`mt-1 text-2xl font-bold ${parseFloat(customer.account_balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}
                                            >
                                                {formatCurrency(
                                                    customer.account_balance,
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Credit Limit
                                            </label>
                                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    customer.credit_limit,
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Available Credit
                                            </label>
                                            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(
                                                    availableCredit ?? 0,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                                        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No credit limit set for this
                                            customer
                                        </p>
                                        {canManageCredit && (
                                            <Link
                                                href={CustomerController.edit.url(
                                                    { customer: customer.id },
                                                )}
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-4"
                                                >
                                                    Set Credit Limit
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="Recent Orders">
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        <ShoppingCart className="h-5 w-5" />
                                        Recent Orders
                                    </h2>
                                </div>

                                {recentOrders && recentOrders.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.order_number}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {order.shop?.name} •{' '}
                                                            {new Date(
                                                                order.created_at,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(
                                                            order.total_amount,
                                                        )}
                                                    </p>
                                                    <Badge
                                                        size="sm"
                                                        color={
                                                            order.payment_status ===
                                                            'paid'
                                                                ? 'success'
                                                                : order.payment_status ===
                                                                    'partial'
                                                                  ? 'warning'
                                                                  : 'error'
                                                        }
                                                    >
                                                        {order.payment_status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            No orders yet
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {customer.addresses &&
                            customer.addresses.length > 0 && (
                                <Card title="Addresses">
                                    <div className="p-6">
                                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                            <MapPin className="h-5 w-5" />
                                            Addresses
                                        </h2>

                                        <div className="space-y-3">
                                            {customer.addresses.map(
                                                (address) => (
                                                    <div
                                                        key={address.id}
                                                        className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                                    >
                                                        <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {
                                                                        address.label
                                                                    }
                                                                </p>
                                                                {address.is_default && (
                                                                    <Badge
                                                                        size="sm"
                                                                        color="info"
                                                                    >
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                {address.street}
                                                                , {address.city}
                                                                ,{' '}
                                                                {address.state}{' '}
                                                                {
                                                                    address.postal_code
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}
                    </div>

                    <div className="space-y-6">
                        <Card title="Quick Stats">
                            <div className="p-6">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <Wallet className="h-5 w-5" />
                                    Quick Stats
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Orders
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {customer.orders_count ?? 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Spent
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                customer.total_purchases,
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Addresses
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {customer.addresses_count ?? 0}
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
                                            Registered
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(
                                                customer.created_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    {customer.last_purchase_at && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Last Purchase
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {new Date(
                                                    customer.last_purchase_at,
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {customer.email_verified_at && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Email Verified
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {new Date(
                                                    customer.email_verified_at,
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-3">
                            <Link
                                href={CustomerController.edit.url({
                                    customer: customer.id,
                                })}
                            >
                                <Button className="w-full gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Customer
                                </Button>
                            </Link>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleToggleStatus}
                            >
                                {customer.is_active ? 'Deactivate' : 'Activate'}{' '}
                                Customer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
