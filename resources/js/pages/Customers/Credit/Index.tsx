import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import { Search, DollarSign, Users, TrendingUp } from 'lucide-react';
import CustomerCreditController from '@/actions/App/Http/Controllers/CustomerCreditController';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    account_balance: number;
    credit_limit: number;
    total_purchases: number;
}

interface Props {
    shop: any;
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        sort?: string;
    };
    stats: {
        total_customers: number;
        total_balance: number;
        total_limit: number;
    };
}

/**
 * Customer credit accounts index page.
 * Lists all customers with credit accounts and their balances.
 */
const Index: React.FC<Props> = ({ shop, customers, filters, stats }) => {
    const [search, setSearch] = React.useState(filters.search || '');
    const [sort, setSort] = React.useState(filters.sort || '');

    const handleSearch = () => {
        router.get(
            CustomerCreditController.index.url({ shop: shop.id }),
            { search, sort },
            { preserveState: true }
        );
    };

    const calculateAvailableCredit = (customer: Customer) => {
        return Math.max(0, customer.credit_limit - customer.account_balance);
    };

    const getCreditUsagePercent = (customer: Customer) => {
        if (!customer.credit_limit) return 0;
        return (customer.account_balance / customer.credit_limit) * 100;
    };

    const getCreditStatus = (customer: Customer) => {
        const usage = getCreditUsagePercent(customer);
        if (usage >= 90) return { color: 'error' as const, label: 'Critical' };
        if (usage >= 75) return { color: 'warning' as const, label: 'High' };
        if (usage >= 50) return { color: 'info' as const, label: 'Moderate' };
        return { color: 'success' as const, label: 'Good' };
    };

    return (
        <AppLayout>
            <Head title={`Customer Credit - ${shop.name}`} />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Customer Credit Accounts</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Customers</p>
                                <p className="text-3xl font-bold mt-2">{stats.total_customers}</p>
                            </div>
                            <div className="bg-primary-100 p-3 rounded-full">
                                <Users className="w-8 h-8 text-primary-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Outstanding</p>
                                <p className="text-3xl font-bold mt-2">
                                    {shop.currency_symbol}{stats.total_balance.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-warning-100 p-3 rounded-full">
                                <DollarSign className="w-8 h-8 text-warning-600" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Credit Limit</p>
                                <p className="text-3xl font-bold mt-2">
                                    {shop.currency_symbol}{stats.total_limit.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-success-100 p-3 rounded-full">
                                <TrendingUp className="w-8 h-8 text-success-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'Sort by...' },
                                    { value: 'balance_high', label: 'Balance (High to Low)' },
                                    { value: 'balance_low', label: 'Balance (Low to High)' },
                                    { value: 'limit_high', label: 'Limit (High to Low)' },
                                    { value: 'limit_low', label: 'Limit (Low to High)' },
                                ]}
                                value={sort}
                                onChange={(value) => setSort(value)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleSearch}
                            startIcon={<Search />}
                        >
                            Search
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Balance
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Credit Limit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Available
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customers.data.map((customer) => {
                                    const status = getCreditStatus(customer);
                                    const available = calculateAvailableCredit(customer);

                                    return (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {customer.first_name} {customer.last_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{customer.email}</div>
                                                {customer.phone && (
                                                    <div className="text-sm text-gray-500">{customer.phone}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {shop.currency_symbol}{customer.account_balance.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm text-gray-900">
                                                    {shop.currency_symbol}{customer.credit_limit.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-success-600">
                                                    {shop.currency_symbol}{available.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <Badge color={status.color} size="sm">
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={CustomerCreditController.show.url({
                                                        shop: shop.id,
                                                        customer: customer.id
                                                    })}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {customers.data.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No customers found with credit accounts.</p>
                        </div>
                    )}

                    {customers.last_page > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex gap-2">
                                {Array.from({ length: customers.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === customers.current_page ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => router.get(
                                            CustomerCreditController.index.url({ shop: shop.id }),
                                            { ...filters, page },
                                            { preserveState: true }
                                        )}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
};

export default Index;
