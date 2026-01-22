import FinancialsTab from '@/components/dashboard/tabs/FinancialsTab';
import InventoryTab from '@/components/dashboard/tabs/InventoryTab';
import OverviewTab from '@/components/dashboard/tabs/OverviewTab';
import SalesTab from '@/components/dashboard/tabs/SalesTab';
import SuppliersTab from '@/components/dashboard/tabs/SuppliersTab';
import Select from '@/components/form/Select';
import DatePicker from '@/components/form/date-picker';
import Button from '@/components/ui/button/Button';
import { TabContent, TabList, TabTrigger } from '@/components/ui/tabs/Tab';
import AppLayout from '@/layouts/AppLayout';
import {
    DashboardMetrics,
    DashboardProps,
    FinancialData,
    InventoryData,
    SalesData,
    SupplierData,
} from '@/types/dashboard';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    DollarSign,
    Package,
    RefreshCw,
    TrendingUp,
    Truck,
} from 'lucide-react';
import React, { useState } from 'react';

export default function Dashboard({
    activeTab,
    data,
    shops,
    selectedShop,
    period,
    startDate,
    endDate,
    can_view_financials,
}: DashboardProps) {
    const [showDatePickers, setShowDatePickers] = useState(period === 'custom');

    const handleFilterChange = (filters: Record<string, string>) => {
        router.get('/dashboard', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTabChange = (tab: string) => {
        const filters: Record<string, string> = { tab, period };
        if (selectedShop) filters.shop = selectedShop.toString();
        if (period === 'custom' && startDate && endDate) {
            filters.from = startDate;
            filters.to = endDate;
        }
        handleFilterChange(filters);
    };

    const handleShopChange = (value: string) => {
        const filters: Record<string, string> = { tab: activeTab, period };
        if (value) filters.shop = value;
        if (period === 'custom' && startDate && endDate) {
            filters.from = startDate;
            filters.to = endDate;
        }
        handleFilterChange(filters);
    };

    const handlePeriodChange = (value: string) => {
        setShowDatePickers(value === 'custom');
        if (value !== 'custom') {
            const filters: Record<string, string> = {
                tab: activeTab,
                period: value,
            };
            if (selectedShop) filters.shop = selectedShop.toString();
            handleFilterChange(filters);
        }
    };

    const handleDateChange = () => {
        const fromInput = document.getElementById(
            'from-date',
        ) as HTMLInputElement;
        const toInput = document.getElementById('to-date') as HTMLInputElement;

        if (fromInput?.value && toInput?.value) {
            const filters: Record<string, string> = {
                tab: activeTab,
                period: 'custom',
                from: fromInput.value,
                to: toInput.value,
            };
            if (selectedShop) filters.shop = selectedShop.toString();
            handleFilterChange(filters);
        }
    };

    const handleRefresh = () => {
        router.post(
            '/dashboard/refresh',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const shopOptions = [
        { value: '', label: 'All Shops' },
        ...shops.map((shop) => ({
            value: shop.id.toString(),
            label: shop.name,
        })),
    ];

    const periodOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Overview of your business metrics
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-40">
                            <Select
                                options={shopOptions}
                                defaultValue={
                                    selectedShop ? selectedShop.toString() : ''
                                }
                                onChange={handleShopChange}
                                placeholder="Select shop"
                            />
                        </div>

                        <div className="w-40">
                            <Select
                                options={periodOptions}
                                defaultValue={period}
                                onChange={handlePeriodChange}
                                placeholder="Period"
                            />
                        </div>

                        {showDatePickers && (
                            <>
                                <DatePicker
                                    id="from-date"
                                    mode="single"
                                    defaultDate={startDate || undefined}
                                    placeholder="From"
                                    onChange={handleDateChange}
                                />

                                <DatePicker
                                    id="to-date"
                                    mode="single"
                                    defaultDate={endDate || undefined}
                                    placeholder="To"
                                    onChange={handleDateChange}
                                />
                            </>
                        )}

                        <Button
                            variant="outline"
                            size="md"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div>
                    <TabList variant="underline">
                        <TabTrigger
                            variant="underline"
                            isActive={activeTab === 'overview'}
                            onClick={() => handleTabChange('overview')}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Overview
                        </TabTrigger>
                        <TabTrigger
                            variant="underline"
                            isActive={activeTab === 'sales'}
                            onClick={() => handleTabChange('sales')}
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Sales
                        </TabTrigger>
                        <TabTrigger
                            variant="underline"
                            isActive={activeTab === 'inventory'}
                            onClick={() => handleTabChange('inventory')}
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Inventory
                        </TabTrigger>
                        <TabTrigger
                            variant="underline"
                            isActive={activeTab === 'suppliers'}
                            onClick={() => handleTabChange('suppliers')}
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            Suppliers
                        </TabTrigger>
                        {can_view_financials && (
                            <TabTrigger
                                variant="underline"
                                isActive={activeTab === 'financials'}
                                onClick={() => handleTabChange('financials')}
                            >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Financials
                            </TabTrigger>
                        )}
                    </TabList>

                    <TabContent>
                        {activeTab === 'overview' && (
                            <OverviewTab
                                data={data as DashboardMetrics}
                                canViewFinancials={can_view_financials}
                            />
                        )}
                        {activeTab === 'sales' && (
                            <SalesTab data={data as SalesData} />
                        )}
                        {activeTab === 'inventory' && (
                            <InventoryTab data={data as InventoryData} />
                        )}
                        {activeTab === 'suppliers' && (
                            <SuppliersTab data={data as SupplierData} />
                        )}
                        {activeTab === 'financials' && (
                            <FinancialsTab data={data as FinancialData} />
                        )}
                    </TabContent>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
