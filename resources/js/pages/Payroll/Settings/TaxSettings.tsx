import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import {
    ArrowLeft,
    Receipt,
    Calculator,
    Info,
    ExternalLink,
    CheckCircle,
} from 'lucide-react';
import type { TaxTable, TaxTableBand, TaxRelief } from '@/types/payroll';

interface Props {
    activeTaxTable: TaxTable | null;
    taxTables: TaxTable[];
}

export default function TaxSettings({ activeTaxTable, taxTables }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercent = (value: number) => {
        return `${value}%`;
    };

    return (
        <>
            <Head title="Tax Settings" />

            <div className="mb-6">
                <Link href={PayrollController.index.url()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        startIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Payroll
                    </Button>
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View and manage PAYE tax configurations for payroll calculations
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {activeTaxTable ? (
                        <>
                            <Card className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-error-100 p-3 dark:bg-error-900/20">
                                            <Receipt className="h-6 w-6 text-error-600 dark:text-error-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {activeTaxTable.name}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Tax Year {activeTaxTable.tax_year}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge color="success" size="md">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Active
                                    </Badge>
                                </div>

                                {activeTaxTable.description && (
                                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                                        {activeTaxTable.description}
                                    </p>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Country</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Nigeria ({activeTaxTable.country_code})
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Effective From
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {new Date(activeTaxTable.effective_from).toLocaleDateString(
                                                'en-NG',
                                                { year: 'numeric', month: 'long', day: 'numeric' }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="overflow-hidden">
                                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Tax Bands (Annual Income)
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Progressive tax rates applied to different income brackets
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Band
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    From
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    To
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Rate
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Cumulative Tax
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                            {activeTaxTable.bands?.map((band, index) => (
                                                <tr key={band.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        {band.band_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                        {formatCurrency(band.lower_limit)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                        {band.upper_limit
                                                            ? formatCurrency(band.upper_limit)
                                                            : 'Above'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Badge
                                                            color={
                                                                band.rate <= 7
                                                                    ? 'success'
                                                                    : band.rate <= 15
                                                                    ? 'info'
                                                                    : band.rate <= 21
                                                                    ? 'warning'
                                                                    : 'error'
                                                            }
                                                            size="sm"
                                                        >
                                                            {formatPercent(band.rate)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(band.cumulative_tax)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {activeTaxTable.reliefs && activeTaxTable.reliefs.length > 0 && (
                                <Card className="overflow-hidden">
                                    <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Tax Reliefs
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Deductions applied before calculating taxable income
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                        Relief
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                        Type
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                        Value
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                        Max Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                {activeTaxTable.reliefs.map((relief) => (
                                                    <tr
                                                        key={relief.id}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900 dark:text-white">
                                                                    {relief.name}
                                                                </span>
                                                                {relief.description && (
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {relief.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                            <Badge color="info" size="sm">
                                                                {relief.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                            {relief.is_percentage
                                                                ? formatPercent(relief.value)
                                                                : formatCurrency(relief.value)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                            {relief.max_amount
                                                                ? formatCurrency(relief.max_amount)
                                                                : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="p-8 text-center">
                            <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                No Active Tax Table
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Contact your system administrator to configure tax tables.
                            </p>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                How PAYE is Calculated
                            </h3>
                        </div>
                        <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    1
                                </span>
                                <span>Calculate gross annual income (monthly × 12)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    2
                                </span>
                                <span>Apply Consolidated Relief Allowance (CRA)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    3
                                </span>
                                <span>Deduct pension contributions (8%)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    4
                                </span>
                                <span>Calculate taxable income</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    5
                                </span>
                                <span>Apply progressive tax rates per band</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                    6
                                </span>
                                <span>Divide by 12 for monthly PAYE</span>
                            </li>
                        </ol>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5 text-info-600 dark:text-info-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Consolidated Relief Allowance
                            </h3>
                        </div>
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                            The CRA is calculated as the higher of:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                <span>₦200,000 + 20% of Gross Income</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                <span>1% of Gross Income</span>
                            </li>
                        </ul>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Resources</h3>
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="https://www.firs.gov.ng"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                >
                                    Federal Inland Revenue Service (FIRS)
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.pencom.gov.ng"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                >
                                    National Pension Commission (PenCom)
                                </a>
                            </li>
                        </ul>
                    </Card>

                    {taxTables.length > 1 && (
                        <Card className="p-6">
                            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                                Available Tax Tables
                            </h3>
                            <ul className="space-y-2">
                                {taxTables.map((table) => (
                                    <li
                                        key={table.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {table.name} ({table.tax_year})
                                        </span>
                                        {table.is_active ? (
                                            <Badge color="success" size="sm">Active</Badge>
                                        ) : (
                                            <Badge color="light" size="sm">Inactive</Badge>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

TaxSettings.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
