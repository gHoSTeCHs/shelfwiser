import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import EmptyState from '@/components/ui/EmptyState';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import { Calendar, DollarSign, Users, Plus, FileText } from 'lucide-react';

interface Shop {
    id: number;
    name: string;
}

interface StatusOption {
    value: string;
    label: string;
}

interface PayrollPeriod {
    id: number;
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
    status: string;
    total_gross_pay: string;
    total_deductions: string;
    total_net_pay: string;
    employee_count: number;
    includes_general_manager: boolean;
    requires_owner_approval: boolean;
    shop?: {
        id: number;
        name: string;
    };
}

interface Props {
    payrollPeriods: PayrollPeriod[];
    filters: {
        shop_id?: string;
        status?: string;
    };
    shops: Shop[];
    statusOptions: StatusOption[];
}

export default function Index({ payrollPeriods, filters, shops, statusOptions }: Props) {
    const [shopId, setShopId] = useState(filters.shop_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilterChange = (shopId: string, status: string) => {
        const params: Record<string, string> = {};
        if (shopId) params.shop_id = shopId;
        if (status) params.status = status;

        router.get(PayrollController.index.url(), params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleShopChange = (value: string) => {
        setShopId(value);
        handleFilterChange(value, status);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        handleFilterChange(shopId, value);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'light';
            case 'processing':
                return 'warning';
            case 'processed':
                return 'info';
            case 'approved':
                return 'success';
            case 'paid':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'light';
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(parseFloat(amount.toString()));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const totalGrossPay = payrollPeriods.reduce(
        (sum, period) => sum + parseFloat(period.total_gross_pay),
        0
    );
    const totalDeductions = payrollPeriods.reduce(
        (sum, period) => sum + parseFloat(period.total_deductions),
        0
    );
    const totalNetPay = payrollPeriods.reduce(
        (sum, period) => sum + parseFloat(period.total_net_pay),
        0
    );

    return (
        <AppLayout>
            <Head title="Payroll Management" />

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Payroll Management</h1>
                    <p className="mt-1 text-sm text-dark-600">
                        Manage payroll periods and process employee payments
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        startIcon={<Plus className="h-4 w-4" />}
                        onClick={() => router.visit(PayrollController.create.url())}
                    >
                        Create Payroll Period
                    </Button>
                </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Total Gross Pay</p>
                            <p className="mt-1 text-2xl font-bold text-dark-900">
                                {formatCurrency(totalGrossPay)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-primary-100 p-3">
                            <DollarSign className="h-6 w-6 text-primary-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Total Deductions</p>
                            <p className="mt-1 text-2xl font-bold text-dark-900">
                                {formatCurrency(totalDeductions)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-warning-100 p-3">
                            <FileText className="h-6 w-6 text-warning-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-600">Total Net Pay</p>
                            <p className="mt-1 text-2xl font-bold text-dark-900">
                                {formatCurrency(totalNetPay)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-success-100 p-3">
                            <DollarSign className="h-6 w-6 text-success-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-dark-200 bg-dark-50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {shops.length > 1 && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-dark-700">
                                    Filter by Shop
                                </label>
                                <Select
                                    options={[
                                        { value: '', label: 'All Shops' },
                                        ...shops.map((shop) => ({
                                            value: shop.id.toString(),
                                            label: shop.name,
                                        })),
                                    ]}
                                    defaultValue={shopId}
                                    onChange={handleShopChange}
                                />
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-medium text-dark-700">
                                Filter by Status
                            </label>
                            <Select
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    ...statusOptions,
                                ]}
                                defaultValue={status}
                                onChange={handleStatusChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {payrollPeriods.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                icon={<Calendar />}
                                title="No payroll periods found"
                                description="Get started by creating your first payroll period."
                                action={
                                    <Button
                                        variant="primary"
                                        onClick={() =>
                                            router.visit(PayrollController.create.url())
                                        }
                                    >
                                        Create Payroll Period
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-dark-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Period
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Shop
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Dates
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Employees
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Gross Pay
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Deductions
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Net Pay
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-200 bg-white">
                                {payrollPeriods.map((period) => (
                                    <tr key={period.id} className="hover:bg-dark-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-dark-900">
                                                    {period.period_name}
                                                </span>
                                                <span className="text-sm text-dark-500">
                                                    Payment: {formatDate(period.payment_date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-dark-600">
                                                {period.shop ? period.shop.name : 'All Shops'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col text-sm text-dark-600">
                                                <span>{formatDate(period.start_date)}</span>
                                                <span className="text-dark-400">to</span>
                                                <span>{formatDate(period.end_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-sm text-dark-600">
                                                <Users className="h-4 w-4" />
                                                <span>{period.employee_count}</span>
                                                {period.includes_general_manager && (
                                                    <Badge color="info" size="sm">
                                                        +GM
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-dark-900">
                                            {formatCurrency(period.total_gross_pay)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-dark-900">
                                            {formatCurrency(period.total_deductions)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-success-600">
                                            {formatCurrency(period.total_net_pay)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    color={getStatusColor(period.status)}
                                                    size="sm"
                                                >
                                                    {statusOptions.find(
                                                        (opt) => opt.value === period.status
                                                    )?.label || period.status}
                                                </Badge>
                                                {period.requires_owner_approval && (
                                                    <Badge color="warning" size="sm">
                                                        Needs Owner
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={PayrollController.show.url({
                                                    payrollPeriod: period.id,
                                                })}
                                                className="text-sm font-medium text-primary-600 hover:text-primary-700"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </AppLayout>
    );
}
