import ReusableBarChart from '@/components/charts/ReusableBarChart';
import ReusablePieChart from '@/components/charts/ReusablePieChart';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { FinancialData } from '@/types/dashboard';
import { ApexOptions } from 'apexcharts';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import Chart from 'react-apexcharts';
import MetricCard from '../MetricCard';

interface FinancialsTabProps {
    data: FinancialData;
}

export default function FinancialsTab({ data }: FinancialsTabProps) {
    const cashFlowOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        colors: ['#10b981', '#ef4444', '#3b82f6'],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 4,
        },
        xaxis: {
            categories: data.cash_flow_trend.labels,
            labels: {
                style: {
                    colors: '#6b7280',
                    fontSize: '12px',
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#6b7280',
                    fontSize: '12px',
                },
                formatter: (value) => formatCurrency(value),
            },
        },
        tooltip: {
            y: {
                formatter: (value) => formatCurrency(value),
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '13px',
            fontWeight: 500,
            markers: {
                size: 5,
                strokeWidth: 0,
            },
        },
    };

    const cashFlowSeries = [
        {
            name: 'Inflow',
            data: data.cash_flow_trend.inflow,
        },
        {
            name: 'Outflow',
            data: data.cash_flow_trend.outflow,
        },
        {
            name: 'Net Flow',
            data: data.cash_flow_trend.net_flow,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(data.summary.total_revenue)}
                    subtitle={`Collected: ${formatCurrency(data.summary.collected_revenue)}`}
                    icon={DollarSign}
                    iconColor="text-brand-600 dark:text-brand-400"
                    iconBgColor="bg-brand-100 dark:bg-brand-900/20"
                />
                <MetricCard
                    title="Gross Profit"
                    value={formatCurrency(data.summary.gross_profit)}
                    subtitle={`Margin: ${formatPercentage(data.summary.profit_margin)}`}
                    icon={TrendingUp}
                    iconColor="text-success-600 dark:text-success-400"
                    iconBgColor="bg-success-100 dark:bg-success-900/20"
                />
                <MetricCard
                    title="Net Profit"
                    value={formatCurrency(data.summary.net_profit)}
                    subtitle={`COGS: ${formatCurrency(data.summary.cogs)}`}
                    icon={
                        data.summary.net_profit >= 0 ? TrendingUp : TrendingDown
                    }
                    iconColor={
                        data.summary.net_profit >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-error-600 dark:text-error-400'
                    }
                    iconBgColor={
                        data.summary.net_profit >= 0
                            ? 'bg-success-100 dark:bg-success-900/20'
                            : 'bg-error-100 dark:bg-error-900/20'
                    }
                />
                <MetricCard
                    title="Cash Flow"
                    value={formatCurrency(data.summary.cash_flow)}
                    subtitle={`Expenses: ${formatCurrency(data.summary.paid_expenses)}`}
                    icon={
                        data.summary.cash_flow >= 0 ? TrendingUp : TrendingDown
                    }
                    iconColor={
                        data.summary.cash_flow >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-error-600 dark:text-error-400'
                    }
                    iconBgColor={
                        data.summary.cash_flow >= 0
                            ? 'bg-success-100 dark:bg-success-900/20'
                            : 'bg-error-100 dark:bg-error-900/20'
                    }
                />
            </div>

            {/* Cash Flow Trend */}
            <Card title="Cash Flow Trend" className="p-6">
                <Chart
                    options={cashFlowOptions}
                    series={cashFlowSeries}
                    type="line"
                    height={350}
                />
            </Card>

            {/* Accounts Receivable & Payable */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Accounts Receivable" className="p-6">
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Total Outstanding
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(
                                    data.accounts_receivable.total_amount,
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Overdue
                            </span>
                            <span className="text-sm font-medium text-error-600">
                                {formatCurrency(
                                    data.accounts_receivable.overdue_amount,
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Count
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {data.accounts_receivable.total_count} orders
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Aging Breakdown
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Current
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(
                                        data.accounts_receivable.aging.current,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    30-60 Days
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(
                                        data.accounts_receivable.aging[
                                            '30_60_days'
                                        ],
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    60-90 Days
                                </span>
                                <span className="font-medium text-warning-600">
                                    {formatCurrency(
                                        data.accounts_receivable.aging[
                                            '60_90_days'
                                        ],
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Over 90 Days
                                </span>
                                <span className="font-medium text-error-600">
                                    {formatCurrency(
                                        data.accounts_receivable.aging
                                            .over_90_days,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Accounts Payable" className="p-6">
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Total Outstanding
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(
                                    data.accounts_payable.total_amount,
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Overdue
                            </span>
                            <span className="text-sm font-medium text-error-600">
                                {formatCurrency(
                                    data.accounts_payable.overdue_amount,
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Count
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {data.accounts_payable.total_count} purchase
                                orders
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Aging Breakdown
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Current
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(
                                        data.accounts_payable.aging.current,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    30-60 Days
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(
                                        data.accounts_payable.aging[
                                            '30_60_days'
                                        ],
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    60-90 Days
                                </span>
                                <span className="font-medium text-warning-600">
                                    {formatCurrency(
                                        data.accounts_payable.aging[
                                            '60_90_days'
                                        ],
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Over 90 Days
                                </span>
                                <span className="font-medium text-error-600">
                                    {formatCurrency(
                                        data.accounts_payable.aging
                                            .over_90_days,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Expense Breakdown & Profit by Shop */}
            <div className="grid gap-6 lg:grid-cols-2">
                {data.expense_breakdown.length > 0 && (
                    <Card title="Expense Breakdown" className="p-6">
                        <ReusablePieChart
                            data={data.expense_breakdown.map((e) => e.amount)}
                            labels={data.expense_breakdown.map(
                                (e) => e.category,
                            )}
                        />
                    </Card>
                )}

                <Card title="Profit by Shop" className="p-6">
                    <ReusableBarChart
                        data={data.profit_by_shop.map((s) => s.net_profit)}
                        labels={data.profit_by_shop.map((s) => s.shop_name)}
                        color="#10b981"
                        height={300}
                    />
                </Card>
            </div>

            {/* Profit Details Table */}
            {data.profit_by_shop.length > 0 && (
                <Card title="Profit Details by Shop" className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Shop
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Revenue
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Gross Profit
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Net Profit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {data.profit_by_shop.map((shop) => (
                                    <tr
                                        key={shop.shop_id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {shop.shop_name}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(shop.revenue)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(shop.gross_profit)}
                                        </td>
                                        <td
                                            className={`px-4 py-4 text-right text-sm font-medium ${shop.net_profit >= 0 ? 'text-success-600' : 'text-error-600'}`}
                                        >
                                            {formatCurrency(shop.net_profit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
