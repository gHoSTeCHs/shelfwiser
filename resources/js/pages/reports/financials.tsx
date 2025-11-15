import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { FinancialReportProps } from '@/types/reports';
import FilterBar from '@/components/reports/FilterBar';
import { Card } from '@/components/ui/card';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
} from 'lucide-react';

export default function FinancialReport({
    financialData,
    shops,
    filters,
}: FinancialReportProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);

    const formatPercent = (value: number) => `${value.toFixed(2)}%`;

    const filterConfig = [
        {
            name: 'from',
            label: 'From Date',
            type: 'date' as const,
            value: filters.from,
        },
        {
            name: 'to',
            label: 'To Date',
            type: 'date' as const,
            value: filters.to,
        },
        {
            name: 'shop',
            label: 'Shop',
            type: 'select' as const,
            options: shops.map((shop) => ({
                label: shop.name,
                value: shop.id,
            })),
            value: filters.shop,
        },
    ];

    const { profit_loss, cash_flow, balance_sheet } = financialData;

    return (
        <>
            <Head title="Financial Report" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Financial Report
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Comprehensive financial statements and analysis
                    </p>
                </div>

                {/* Filters */}
                <FilterBar
                    filters={filterConfig}
                    currentFilters={filters}
                    exportUrl="/reports/financials/export"
                />

                {/* Profit & Loss Statement */}
                <Card title="Profit & Loss Statement" className="p-6">
                    <div className="space-y-4">
                        {/* Revenue Section */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Revenue
                            </h3>
                            <div className="grid gap-2 pl-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Gross Sales
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(profit_loss.gross_sales)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Discounts
                                    </span>
                                    <span className="font-medium text-error-600">
                                        ({formatCurrency(profit_loss.discounts)})
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2 font-medium dark:border-gray-700">
                                    <span>Net Sales</span>
                                    <span>{formatCurrency(profit_loss.net_sales)}</span>
                                </div>
                            </div>
                        </div>

                        {/* COGS & Gross Profit */}
                        <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Cost of Goods Sold (COGS)
                                </span>
                                <span className="font-medium text-error-600">
                                    ({formatCurrency(profit_loss.cogs)})
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200 pt-2 font-medium dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span>Gross Profit</span>
                                    <span className="text-xs text-gray-500">
                                        ({formatPercent(profit_loss.gross_margin)} margin)
                                    </span>
                                </div>
                                <span
                                    className={
                                        profit_loss.gross_profit >= 0
                                            ? 'text-success-600'
                                            : 'text-error-600'
                                    }
                                >
                                    {formatCurrency(profit_loss.gross_profit)}
                                </span>
                            </div>
                        </div>

                        {/* Operating Expenses */}
                        <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Operating Expenses
                                </span>
                                <span className="font-medium text-error-600">
                                    ({formatCurrency(profit_loss.operating_expenses)})
                                </span>
                            </div>
                        </div>

                        {/* Net Profit */}
                        <div className="border-t-2 border-gray-300 pt-4 dark:border-gray-600">
                            <div className="flex items-center justify-between text-lg font-bold">
                                <div className="flex items-center gap-2">
                                    <span>Net Profit</span>
                                    <span className="text-sm font-normal text-gray-500">
                                        ({formatPercent(profit_loss.net_margin)} margin)
                                    </span>
                                </div>
                                <span
                                    className={
                                        profit_loss.net_profit >= 0
                                            ? 'text-success-600'
                                            : 'text-error-600'
                                    }
                                >
                                    {formatCurrency(profit_loss.net_profit)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Cash Flow Statement */}
                    <Card title="Cash Flow Statement" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-success-600" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Cash Inflow
                                    </span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(cash_flow.cash_inflow)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-error-600" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Cash Outflow
                                    </span>
                                </div>
                                <span className="font-medium text-error-600">
                                    ({formatCurrency(cash_flow.cash_outflow)})
                                </span>
                            </div>

                            <div className="border-t-2 border-gray-300 pt-4 dark:border-gray-600">
                                <div className="flex items-center justify-between font-bold">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        <span>Net Cash Flow</span>
                                    </div>
                                    <span
                                        className={
                                            cash_flow.net_cash_flow >= 0
                                                ? 'text-success-600'
                                                : 'text-error-600'
                                        }
                                    >
                                        {formatCurrency(cash_flow.net_cash_flow)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Balance Sheet */}
                    <Card title="Balance Sheet (Current)" className="p-6">
                        <div className="space-y-4">
                            {/* Assets */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Current Assets
                                </h3>
                                <div className="grid gap-2 pl-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Inventory
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(balance_sheet.assets.inventory)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Accounts Receivable
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(balance_sheet.assets.accounts_receivable)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-2 font-medium dark:border-gray-700">
                                        <span>Total Current Assets</span>
                                        <span>{formatCurrency(balance_sheet.assets.total_current_assets)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Liabilities */}
                            <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Current Liabilities
                                </h3>
                                <div className="grid gap-2 pl-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Accounts Payable
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(balance_sheet.liabilities.accounts_payable)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-2 font-medium dark:border-gray-700">
                                        <span>Total Current Liabilities</span>
                                        <span>{formatCurrency(balance_sheet.liabilities.total_current_liabilities)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Working Capital */}
                            <div className="border-t-2 border-gray-300 pt-4 dark:border-gray-600">
                                <div className="flex items-center justify-between font-bold">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        <span>Working Capital</span>
                                    </div>
                                    <span
                                        className={
                                            balance_sheet.working_capital >= 0
                                                ? 'text-success-600'
                                                : 'text-error-600'
                                        }
                                    >
                                        {formatCurrency(balance_sheet.working_capital)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

FinancialReport.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
