import { Shop } from '@/types/shop';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import Label from '../form/Label';
import Select from '../form/Select';
import DatePicker from '../form/date-picker';

interface DashboardFiltersProps {
    shops: Shop[];
    selectedShop: number | null;
    period: 'today' | 'week' | 'month' | 'custom';
    startDate: string | null;
    endDate: string | null;
}

export default function DashboardFilters({
    shops,
    selectedShop,
    period,
    startDate,
    endDate,
}: DashboardFiltersProps) {
    const [localPeriod, setLocalPeriod] = useState(period);
    const [showDatePickers, setShowDatePickers] = useState(period === 'custom');

    const handleShopChange = (value: string) => {
        const params: Record<string, string> = {
            period: localPeriod,
        };

        if (value) {
            params.shop = value;
        }

        if (localPeriod === 'custom' && startDate && endDate) {
            params.from = startDate;
            params.to = endDate;
        }

        router.get(route('dashboard'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePeriodChange = (value: string) => {
        setLocalPeriod(value as 'today' | 'week' | 'month' | 'custom');
        setShowDatePickers(value === 'custom');

        if (value !== 'custom') {
            const params: Record<string, string> = {
                period: value,
            };

            if (selectedShop) {
                params.shop = selectedShop.toString();
            }

            router.get(route('dashboard'), params, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handleDateRangeChange = () => {
        const fromInput = document.getElementById(
            'from-date',
        ) as HTMLInputElement;
        const toInput = document.getElementById('to-date') as HTMLInputElement;

        if (fromInput?.value && toInput?.value) {
            const params: Record<string, string> = {
                period: 'custom',
                from: fromInput.value,
                to: toInput.value,
            };

            if (selectedShop) {
                params.shop = selectedShop.toString();
            }

            router.get(route('dashboard'), params, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handleRefresh = () => {
        router.post(
            route('dashboard.refresh'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Optional: show success message
                },
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Shop Selector */}
                <div>
                    <Label htmlFor="shop-select">Shop</Label>
                    <Select
                        options={shopOptions}
                        defaultValue={
                            selectedShop ? selectedShop.toString() : ''
                        }
                        onChange={handleShopChange}
                        placeholder="Select a shop"
                    />
                </div>

                {/* Period Selector */}
                <div>
                    <Label htmlFor="period-select">Period</Label>
                    <Select
                        options={periodOptions}
                        defaultValue={period}
                        onChange={handlePeriodChange}
                        placeholder="Select a period"
                    />
                </div>

                {/* Date Range Pickers - Show only when Custom is selected */}
                {showDatePickers && (
                    <>
                        <div>
                            <DatePicker
                                id="from-date"
                                label="From Date"
                                mode="single"
                                defaultDate={startDate || undefined}
                                placeholder="Select start date"
                                onChange={handleDateRangeChange}
                            />
                        </div>

                        <div>
                            <DatePicker
                                id="to-date"
                                label="To Date"
                                mode="single"
                                defaultDate={endDate || undefined}
                                placeholder="Select end date"
                                onChange={handleDateRangeChange}
                            />
                        </div>
                    </>
                )}

                {/* Refresh Button */}
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-white transition-colors duration-200 hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:outline-none"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
