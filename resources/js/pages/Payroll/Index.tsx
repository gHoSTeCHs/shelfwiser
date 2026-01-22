import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, DollarSign, FileText, Plus, Users } from 'lucide-react';
import { useState } from 'react';

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

export default function Index({
    payrollPeriods,
    filters,
    shops,
    statusOptions,
}: Props) {
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
        0,
    );
    const totalDeductions = payrollPeriods.reduce(
        (sum, period) => sum + parseFloat(period.total_deductions),
        0,
    );
    const totalNetPay = payrollPeriods.reduce(
        (sum, period) => sum + parseFloat(period.total_net_pay),
        0,
    );

    return (
        <>
            <Head title="Payroll Management" />

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Payroll Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage payroll periods and process employee payments
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        startIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                            router.visit(PayrollController.create.url())
                        }
                    >
                        Create Payroll Period
                    </Button>
                </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Gross Pay
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(totalGrossPay)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                            <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Deductions
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(totalDeductions)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                            <FileText className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Net Pay
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(totalNetPay)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                            <DollarSign className="h-6 w-6 text-success-600 dark:text-success-400" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {shops.length > 1 && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                            router.visit(
                                                PayrollController.create.url(),
                                            )
                                        }
                                    >
                                        Create Payroll Period
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                    >
                                        Period
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400"
                                    >
                                        Shop
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell dark:text-gray-400"
                                    >
                                        Dates
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400"
                                    >
                                        Employees
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400"
                                    >
                                        Gross Pay
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase lg:table-cell dark:text-gray-400"
                                    >
                                        Deductions
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                    >
                                        Net Pay
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {payrollPeriods.map((period) => (
                                    <tr
                                        key={period.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {period.period_name}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    Payment:{' '}
                                                    {formatDate(
                                                        period.payment_date,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {period.shop
                                                    ? period.shop.name
                                                    : 'All Shops'}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <span>
                                                    {formatDate(
                                                        period.start_date,
                                                    )}
                                                </span>
                                                <span className="text-gray-400 dark:text-gray-500">
                                                    to
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        period.end_date,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                <Users className="h-4 w-4" />
                                                <span>
                                                    {period.employee_count}
                                                </span>
                                                {period.includes_general_manager && (
                                                    <Badge
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        +GM
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-right text-sm font-medium text-gray-900 lg:table-cell dark:text-white">
                                            {formatCurrency(
                                                period.total_gross_pay,
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 text-right text-sm font-medium text-gray-900 lg:table-cell dark:text-white">
                                            {formatCurrency(
                                                period.total_deductions,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                            {formatCurrency(
                                                period.total_net_pay,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    color={getStatusColor(
                                                        period.status,
                                                    )}
                                                    size="sm"
                                                >
                                                    {statusOptions.find(
                                                        (opt) =>
                                                            opt.value ===
                                                            period.status,
                                                    )?.label || period.status}
                                                </Badge>
                                                {period.requires_owner_approval && (
                                                    <Badge
                                                        color="warning"
                                                        size="sm"
                                                    >
                                                        Needs Owner
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={PayrollController.show.url(
                                                    {
                                                        payrollPeriod:
                                                            period.id,
                                                    },
                                                )}
                                                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
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
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
