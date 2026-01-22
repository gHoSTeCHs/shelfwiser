import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import InputField from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import type { CustomerIndexPageProps } from '@/types/customer';
import { formatCurrency } from '@/types/customer';
import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, Mail, Phone, Search, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';

const CustomersIndex = ({
    customers,
    statistics,
    shops,
    filters,
}: CustomerIndexPageProps) => {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [creditFilter, setCreditFilter] = useState(filters.has_credit || '');
    const [shopFilter, setShopFilter] = useState(
        filters.shop_id?.toString() || '',
    );

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (creditFilter) params.has_credit = creditFilter;
        if (shopFilter) params.shop_id = shopFilter;

        router.get(CustomerController.index.url(), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setCreditFilter('');
        setShopFilter('');
        router.get(
            CustomerController.index.url(),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFilterChange();
        }
    };

    return (
        <div className="h-screen">
            <Head title="Customers" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Customers
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your customer accounts and credit
                        </p>
                    </div>
                    <Link href={CustomerController.create.url()}>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Customers
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {statistics.total_customers}
                                </p>
                            </div>
                            <div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">
                                <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Active
                                </p>
                                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                                    {statistics.active_customers}
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    With Credit
                                </p>
                                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {statistics.customers_with_credit}
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Balance
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(
                                        statistics.total_credit_balance,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                                <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    New This Month
                                </p>
                                <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {statistics.new_this_month}
                                </p>
                            </div>
                            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                                <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="grid gap-4 sm:grid-cols-5">
                        <div className="sm:col-span-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <InputField
                                    id="search"
                                    type="text"
                                    placeholder="Name, email, or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="status-filter">Status</Label>
                            <Select
                                options={[
                                    { value: '', label: 'All Status' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                                defaultValue={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="credit-filter">Credit</Label>
                            <Select
                                options={[
                                    { value: '', label: 'All' },
                                    { value: 'yes', label: 'Has Credit' },
                                    { value: 'no', label: 'No Credit' },
                                ]}
                                defaultValue={creditFilter}
                                onChange={(value) => setCreditFilter(value)}
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                onClick={handleFilterChange}
                                className="flex-1"
                            >
                                Filter
                            </Button>
                            <Button
                                onClick={handleClearFilters}
                                variant="outline"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                    >
                                        Customer
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-6 py-4 text-left text-sm font-semibold text-gray-900 md:table-cell dark:text-white"
                                    >
                                        Contact
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-6 py-4 text-right text-sm font-semibold text-gray-900 lg:table-cell dark:text-white"
                                    >
                                        Balance
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-6 py-4 text-right text-sm font-semibold text-gray-900 lg:table-cell dark:text-white"
                                    >
                                        Credit Limit
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-6 py-4 text-center text-sm font-semibold text-gray-900 xl:table-cell dark:text-white"
                                    >
                                        Orders
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {customers.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center"
                                        >
                                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                                No customers found
                                            </p>
                                            <Link
                                                href={CustomerController.create.url()}
                                            >
                                                <Button className="mt-4">
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add First Customer
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    customers.data.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={CustomerController.show.url(
                                                        {
                                                            customer:
                                                                customer.id,
                                                        },
                                                    )}
                                                    className="block"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                                                            <span className="text-sm font-semibold">
                                                                {
                                                                    customer
                                                                        .first_name[0]
                                                                }
                                                                {
                                                                    customer
                                                                        .last_name[0]
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                                                                {
                                                                    customer.full_name
                                                                }
                                                            </p>
                                                            {customer.preferred_shop && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {
                                                                        customer
                                                                            .preferred_shop
                                                                            .name
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="hidden px-6 py-4 md:table-cell">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <Mail className="h-3 w-3" />
                                                        {customer.email}
                                                    </div>
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <Phone className="h-3 w-3" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        customer.is_active
                                                            ? 'success'
                                                            : 'error'
                                                    }
                                                >
                                                    {customer.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="hidden px-6 py-4 text-right lg:table-cell">
                                                <span
                                                    className={`font-medium ${parseFloat(customer.account_balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}
                                                >
                                                    {formatCurrency(
                                                        customer.account_balance,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="hidden px-6 py-4 text-right lg:table-cell">
                                                {customer.credit_limit ? (
                                                    <span className="text-gray-900 dark:text-white">
                                                        {formatCurrency(
                                                            customer.credit_limit,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="hidden px-6 py-4 text-center xl:table-cell">
                                                <span className="text-gray-900 dark:text-white">
                                                    {customer.orders_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={CustomerController.show.url(
                                                            {
                                                                customer:
                                                                    customer.id,
                                                            },
                                                        )}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link
                                                        href={CustomerController.edit.url(
                                                            {
                                                                customer:
                                                                    customer.id,
                                                            },
                                                        )}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {customers.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Showing{' '}
                                {(customers.current_page - 1) *
                                    customers.per_page +
                                    1}{' '}
                                to{' '}
                                {Math.min(
                                    customers.current_page * customers.per_page,
                                    customers.total,
                                )}{' '}
                                of {customers.total} customers
                            </p>
                            <div className="flex gap-2">
                                {customers.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={
                                            link.active ? 'primary' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

CustomersIndex.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default CustomersIndex;
