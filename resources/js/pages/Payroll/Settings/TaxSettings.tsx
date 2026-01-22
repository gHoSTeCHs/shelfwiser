import PayrollController from '@/actions/App/Http/Controllers/PayrollController';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { Tab, TabContent, TabList, TabTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDateLong, formatPercentage } from '@/lib/formatters';
import type {
    TaxLawVersion,
    TaxLawVersionOption,
    TaxTable,
} from '@/types/payroll';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calculator,
    CheckCircle,
    Clock,
    ExternalLink,
    Info,
    Receipt,
    Scale,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    activeTaxTable: TaxTable | null;
    taxTables: TaxTable[];
    taxLawVersions?: TaxLawVersionOption[];
    nta2025Countdown?: number;
}

export default function TaxSettings({
    activeTaxTable,
    taxTables,
    taxLawVersions,
    nta2025Countdown,
}: Props) {
    const [activeTab, setActiveTab] = useState<TaxLawVersion | 'comparison'>(
        'pita_2011',
    );

    const pita2011Table = taxTables.find(
        (t) =>
            t.tax_law_reference === 'pita_2011' ||
            (!t.tax_law_reference && t.effective_year < 2026),
    );

    const nta2025Table = taxTables.find(
        (t) => t.tax_law_reference === 'nta_2025',
    );

    const currentTable =
        activeTab === 'pita_2011' ? pita2011Table : nta2025Table;

    const pita2011Bands = [
        { band: 1, from: 0, to: 300000, rate: 7 },
        { band: 2, from: 300001, to: 600000, rate: 11 },
        { band: 3, from: 600001, to: 1100000, rate: 15 },
        { band: 4, from: 1100001, to: 1600000, rate: 19 },
        { band: 5, from: 1600001, to: 3200000, rate: 21 },
        { band: 6, from: 3200001, to: null, rate: 24 },
    ];

    const nta2025Bands = [
        { band: 1, from: 0, to: 800000, rate: 0 },
        { band: 2, from: 800001, to: 3000000, rate: 15 },
        { band: 3, from: 3000001, to: 12000000, rate: 18 },
        { band: 4, from: 12000001, to: 25000000, rate: 21 },
        { band: 5, from: 25000001, to: 50000000, rate: 23 },
        { band: 6, from: 50000001, to: null, rate: 25 },
    ];

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tax Settings
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View and manage PAYE tax configurations for payroll
                    calculations
                </p>
            </div>

            {nta2025Countdown && nta2025Countdown > 0 && (
                <Card className="border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-900/20 mb-6 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-info-100 dark:bg-info-800 rounded-lg p-2">
                                <Clock className="text-info-600 dark:text-info-400 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-info-800 dark:text-info-200 font-semibold">
                                    NTA 2025 Transition
                                </h3>
                                <p className="text-info-600 dark:text-info-400 text-sm">
                                    New tax law becomes effective in{' '}
                                    <strong>{nta2025Countdown} days</strong>{' '}
                                    (January 1, 2026)
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab('comparison')}
                            >
                                Compare Tax Laws
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setActiveTab('nta_2025')}
                            >
                                View NTA 2025
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <Tab>
                <TabList variant="underline">
                    <TabTrigger
                        variant="underline"
                        isActive={activeTab === 'pita_2011'}
                        onClick={() => setActiveTab('pita_2011')}
                    >
                        <Receipt className="mr-2 h-4 w-4" />
                        PITA 2011
                        {activeTaxTable?.tax_law_reference !== 'nta_2025' && (
                            <span className="ml-2">
                                <Badge color="success" size="sm">
                                    Current
                                </Badge>
                            </span>
                        )}
                    </TabTrigger>
                    <TabTrigger
                        variant="underline"
                        isActive={activeTab === 'nta_2025'}
                        onClick={() => setActiveTab('nta_2025')}
                    >
                        <Receipt className="mr-2 h-4 w-4" />
                        NTA 2025
                        <span className="ml-2">
                            <Badge color="info" size="sm">
                                Jan 2026
                            </Badge>
                        </span>
                    </TabTrigger>
                    <TabTrigger
                        variant="underline"
                        isActive={activeTab === 'comparison'}
                        onClick={() => setActiveTab('comparison')}
                    >
                        <Scale className="mr-2 h-4 w-4" />
                        Compare
                    </TabTrigger>
                </TabList>

                <TabContent>
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        {activeTab === 'comparison' ? (
                            <div className="space-y-6 lg:col-span-3">
                                <Card className="overflow-hidden">
                                    <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Tax Band Comparison
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Side-by-side comparison of PITA 2011
                                            and NTA 2025 tax bands
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th
                                                        colSpan={3}
                                                        className="border-r border-gray-200 px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:border-gray-700 dark:text-gray-400"
                                                    >
                                                        PITA 2011
                                                    </th>
                                                    <th
                                                        colSpan={3}
                                                        className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                    >
                                                        NTA 2025
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        From
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        To
                                                    </th>
                                                    <th scope="col" className="border-r border-gray-200 px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:border-gray-700 dark:text-gray-400">
                                                        Rate
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        From
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        To
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                        Rate
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                {Array.from({ length: 6 }).map(
                                                    (_, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                        >
                                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                {formatCurrency(
                                                                    pita2011Bands[
                                                                        idx
                                                                    ].from,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                {pita2011Bands[
                                                                    idx
                                                                ].to
                                                                    ? formatCurrency(
                                                                          pita2011Bands[
                                                                              idx
                                                                          ].to,
                                                                      )
                                                                    : 'Above'}
                                                            </td>
                                                            <td className="border-r border-gray-200 px-4 py-3 text-center dark:border-gray-700">
                                                                <Badge
                                                                    color={
                                                                        pita2011Bands[
                                                                            idx
                                                                        ]
                                                                            .rate <=
                                                                        7
                                                                            ? 'success'
                                                                            : pita2011Bands[
                                                                                    idx
                                                                                ]
                                                                                    .rate <=
                                                                                15
                                                                              ? 'info'
                                                                              : pita2011Bands[
                                                                                      idx
                                                                                  ]
                                                                                      .rate <=
                                                                                  21
                                                                                ? 'warning'
                                                                                : 'error'
                                                                    }
                                                                    size="sm"
                                                                >
                                                                    {formatPercentage(
                                                                        pita2011Bands[
                                                                            idx
                                                                        ].rate,
                                                                    )}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                {formatCurrency(
                                                                    nta2025Bands[
                                                                        idx
                                                                    ].from,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                {nta2025Bands[
                                                                    idx
                                                                ].to
                                                                    ? formatCurrency(
                                                                          nta2025Bands[
                                                                              idx
                                                                          ].to,
                                                                      )
                                                                    : 'Above'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <Badge
                                                                    color={
                                                                        nta2025Bands[
                                                                            idx
                                                                        ]
                                                                            .rate ===
                                                                        0
                                                                            ? 'success'
                                                                            : nta2025Bands[
                                                                                    idx
                                                                                ]
                                                                                    .rate <=
                                                                                15
                                                                              ? 'info'
                                                                              : nta2025Bands[
                                                                                      idx
                                                                                  ]
                                                                                      .rate <=
                                                                                  21
                                                                                ? 'warning'
                                                                                : 'error'
                                                                    }
                                                                    size="sm"
                                                                >
                                                                    {nta2025Bands[
                                                                        idx
                                                                    ].rate === 0
                                                                        ? 'EXEMPT'
                                                                        : formatPercentage(
                                                                              nta2025Bands[
                                                                                  idx
                                                                              ]
                                                                                  .rate,
                                                                          )}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card className="p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                PITA 2011 Calculation
                                            </h3>
                                        </div>
                                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            <li className="flex gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    1
                                                </span>
                                                <span>
                                                    Calculate gross (monthly ×
                                                    12)
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    2
                                                </span>
                                                <span>
                                                    Calculate CRA: max(1%+₦200K,
                                                    20%)
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    3
                                                </span>
                                                <span>Deduct pension (8%)</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    4
                                                </span>
                                                <span>
                                                    Apply progressive bands
                                                    (7%-24%)
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                    5
                                                </span>
                                                <span>
                                                    Divide by 12 for monthly
                                                </span>
                                            </li>
                                        </ol>
                                    </Card>

                                    <Card className="p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Calculator className="text-info-600 dark:text-info-400 h-5 w-5" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                NTA 2025 Calculation
                                            </h3>
                                        </div>
                                        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            <li className="flex gap-2">
                                                <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                    1
                                                </span>
                                                <span>
                                                    Check low-income exemption
                                                    (≤₦800K)
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                    2
                                                </span>
                                                <span>
                                                    Calculate rent relief (if
                                                    eligible)
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                    3
                                                </span>
                                                <span>Deduct pension (8%)</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                    4
                                                </span>
                                                <span>
                                                    Apply progressive bands
                                                    (0%-25%)
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                    5
                                                </span>
                                                <span>
                                                    Divide by 12 for monthly
                                                </span>
                                            </li>
                                        </ol>
                                    </Card>
                                </div>

                                <Card className="border-warning-200 bg-warning-50 p-6 dark:border-warning-800 dark:bg-warning-900/20">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                                        <div>
                                            <h3 className="font-semibold text-warning-800 dark:text-warning-200">
                                                Key Difference: CRA is ABOLISHED
                                                under NTA 2025
                                            </h3>
                                            <p className="mt-1 text-sm text-warning-600 dark:text-warning-400">
                                                The Consolidated Relief
                                                Allowance (CRA) will no longer
                                                apply for periods starting
                                                January 1, 2026. Instead, a new
                                                low-income exemption threshold
                                                and rent relief have been
                                                introduced.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6 lg:col-span-2">
                                    {currentTable ? (
                                        <>
                                            <Card className="p-6">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-lg bg-error-100 p-3 dark:bg-error-900/20">
                                                            <Receipt className="h-6 w-6 text-error-600 dark:text-error-400" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                {
                                                                    currentTable.name
                                                                }
                                                            </h2>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                Tax Year{' '}
                                                                {
                                                                    currentTable.effective_year
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {activeTab ===
                                                            'nta_2025' && (
                                                            <Badge
                                                                color="info"
                                                                size="md"
                                                            >
                                                                <Clock className="mr-1 h-3 w-3" />
                                                                Pending
                                                            </Badge>
                                                        )}
                                                        {currentTable.is_active &&
                                                            activeTab ===
                                                                'pita_2011' && (
                                                                <Badge
                                                                    color="success"
                                                                    size="md"
                                                                >
                                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                                    Active
                                                                </Badge>
                                                            )}
                                                    </div>
                                                </div>

                                                {currentTable.description && (
                                                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                                                        {
                                                            currentTable.description
                                                        }
                                                    </p>
                                                )}

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Country
                                                        </p>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            Nigeria (
                                                            {currentTable.jurisdiction ||
                                                                'NG'}
                                                            )
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Effective From
                                                        </p>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {currentTable.effective_from
                                                                ? formatDateLong(
                                                                      currentTable.effective_from,
                                                                  )
                                                                : 'Not set'}
                                                        </p>
                                                    </div>
                                                    {activeTab ===
                                                        'nta_2025' && (
                                                        <>
                                                            <div className="rounded-lg bg-success-50 p-3 dark:bg-success-900/20">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    Low Income
                                                                    Exemption
                                                                </p>
                                                                <p className="font-medium text-success-600 dark:text-success-400">
                                                                    {currentTable.has_low_income_exemption
                                                                        ? `≤ ${formatCurrency(
                                                                              currentTable.low_income_threshold ||
                                                                                  800000,
                                                                          )}`
                                                                        : 'Not applicable'}
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    CRA
                                                                    Applicable
                                                                </p>
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {currentTable.cra_applicable
                                                                        ? 'Yes'
                                                                        : 'No (Abolished)'}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </Card>

                                            <Card className="overflow-hidden">
                                                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Tax Bands (Annual
                                                        Income)
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Progressive tax rates
                                                        applied to different
                                                        income brackets
                                                    </p>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                                            <tr>
                                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                    Band
                                                                </th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                    From
                                                                </th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                    To
                                                                </th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                    Rate
                                                                </th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                    Cumulative
                                                                    Tax
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                            {currentTable.bands?.map(
                                                                (
                                                                    band,
                                                                    index,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            band.id
                                                                        }
                                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                                    >
                                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                                            {
                                                                                band.band_name
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                                            {formatCurrency(
                                                                                band.lower_limit,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                                            {band.upper_limit
                                                                                ? formatCurrency(
                                                                                      band.upper_limit,
                                                                                  )
                                                                                : 'Above'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <Badge
                                                                                color={
                                                                                    band.rate ===
                                                                                    0
                                                                                        ? 'success'
                                                                                        : band.rate <=
                                                                                            7
                                                                                          ? 'success'
                                                                                          : band.rate <=
                                                                                              15
                                                                                            ? 'info'
                                                                                            : band.rate <=
                                                                                                21
                                                                                              ? 'warning'
                                                                                              : 'error'
                                                                                }
                                                                                size="sm"
                                                                            >
                                                                                {band.rate ===
                                                                                0
                                                                                    ? 'EXEMPT'
                                                                                    : formatPercentage(
                                                                                          band.rate,
                                                                                      )}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                                            {formatCurrency(
                                                                                band.cumulative_tax,
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>

                                            {currentTable.reliefs &&
                                                currentTable.reliefs.length >
                                                    0 && (
                                                    <Card className="overflow-hidden">
                                                        <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                Tax Reliefs
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                Deductions
                                                                applied before
                                                                calculating
                                                                taxable income
                                                            </p>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                                    <tr>
                                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Relief
                                                                        </th>
                                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Type
                                                                        </th>
                                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Value
                                                                        </th>
                                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                                                            Max
                                                                            Amount
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                                    {currentTable.reliefs.map(
                                                                        (
                                                                            relief,
                                                                        ) => (
                                                                            <tr
                                                                                key={
                                                                                    relief.id
                                                                                }
                                                                                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                                            >
                                                                                <td className="px-4 py-3">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                                                            {
                                                                                                relief.name
                                                                                            }
                                                                                        </span>
                                                                                        {relief.description && (
                                                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                                                {
                                                                                                    relief.description
                                                                                                }
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                                                    <Badge
                                                                                        color="info"
                                                                                        size="sm"
                                                                                    >
                                                                                        {
                                                                                            relief.relief_type
                                                                                        }
                                                                                    </Badge>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                                                    {relief.rate
                                                                                        ? formatPercentage(
                                                                                              relief.rate,
                                                                                          )
                                                                                        : relief.amount
                                                                                          ? formatCurrency(
                                                                                                relief.amount,
                                                                                            )
                                                                                          : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                                                    {relief.cap
                                                                                        ? formatCurrency(
                                                                                              relief.cap,
                                                                                          )
                                                                                        : '-'}
                                                                                </td>
                                                                            </tr>
                                                                        ),
                                                                    )}
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
                                                No Tax Table Configured
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {activeTab === 'nta_2025'
                                                    ? 'NTA 2025 tax table has not been configured yet.'
                                                    : 'Contact your system administrator to configure tax tables.'}
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
                                        {activeTab === 'pita_2011' ? (
                                            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                                        1
                                                    </span>
                                                    <span>
                                                        Calculate gross annual
                                                        income (monthly × 12)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                                        2
                                                    </span>
                                                    <span>
                                                        Apply Consolidated
                                                        Relief Allowance (CRA)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                                        3
                                                    </span>
                                                    <span>
                                                        Deduct pension
                                                        contributions (8%)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                                        4
                                                    </span>
                                                    <span>
                                                        Calculate taxable income
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                                        5
                                                    </span>
                                                    <span>
                                                        Apply progressive tax
                                                        rates per band
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                                        6
                                                    </span>
                                                    <span>
                                                        Divide by 12 for monthly
                                                        PAYE
                                                    </span>
                                                </li>
                                            </ol>
                                        ) : (
                                            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex gap-2">
                                                    <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                        1
                                                    </span>
                                                    <span>
                                                        Check low-income
                                                        exemption (≤₦800K)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                        2
                                                    </span>
                                                    <span>
                                                        Calculate rent relief
                                                        (if eligible)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                        3
                                                    </span>
                                                    <span>
                                                        Deduct pension
                                                        contributions (8%)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                        4
                                                    </span>
                                                    <span>
                                                        Apply progressive tax
                                                        rates (0%-25%)
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="bg-info-100 text-info-600 dark:bg-info-900/20 dark:text-info-400 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                                        5
                                                    </span>
                                                    <span>
                                                        Divide by 12 for monthly
                                                        PAYE
                                                    </span>
                                                </li>
                                            </ol>
                                        )}
                                    </Card>

                                    {activeTab === 'pita_2011' && (
                                        <Card className="p-6">
                                            <div className="mb-4 flex items-center gap-2">
                                                <Info className="text-info-600 dark:text-info-400 h-5 w-5" />
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    Consolidated Relief
                                                    Allowance
                                                </h3>
                                            </div>
                                            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                                                The CRA is calculated as the
                                                higher of:
                                            </p>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                                    <span>
                                                        1% of Gross Income +
                                                        ₦200,000
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                                    <span>
                                                        20% of Gross Income
                                                    </span>
                                                </li>
                                            </ul>
                                        </Card>
                                    )}

                                    {activeTab === 'nta_2025' && (
                                        <Card className="border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-900/20 p-6">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Info className="text-info-600 dark:text-info-400 h-5 w-5" />
                                                <h3 className="text-info-800 dark:text-info-200 font-semibold">
                                                    NTA 2025 Key Changes
                                                </h3>
                                            </div>
                                            <ul className="text-info-700 dark:text-info-300 space-y-2 text-sm">
                                                <li>• CRA is abolished</li>
                                                <li>
                                                    • Income ≤ ₦800,000 is
                                                    tax-exempt
                                                </li>
                                                <li>
                                                    • Rent relief: min(₦500K,
                                                    20% of rent)
                                                </li>
                                                <li>
                                                    • Top marginal rate: 25%
                                                </li>
                                                <li>• Minimum tax abolished</li>
                                            </ul>
                                        </Card>
                                    )}

                                    <Card className="p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Resources
                                            </h3>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            <li>
                                                <a
                                                    href="https://www.firs.gov.ng"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                                >
                                                    Federal Inland Revenue
                                                    Service (FIRS)
                                                </a>
                                            </li>
                                            <li>
                                                <a
                                                    href="https://www.pencom.gov.ng"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                                >
                                                    National Pension Commission
                                                    (PenCom)
                                                </a>
                                            </li>
                                        </ul>
                                    </Card>
                                </div>
                            </>
                        )}
                    </div>
                </TabContent>
            </Tab>
        </>
    );
}

TaxSettings.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
