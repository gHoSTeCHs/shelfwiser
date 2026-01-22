/**
 * Centralized formatting utilities for dates, numbers, and currencies.
 * This is the SINGLE SOURCE OF TRUTH for all formatting functions.
 * DO NOT create local formatDate or formatCurrency functions in components.
 */

export const formatDateShort = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateLong = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatRelativeTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDateShort(dateString);
};

export type NumberLocale = 'en-US' | 'en-NG';

export const formatNumber = (
    num: number | string | null | undefined,
    decimals = 2,
    locale: NumberLocale = 'en-US',
): string => {
    if (num === null || num === undefined) return '0';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0';
    return value.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

export const formatPercentage = (num: number | string | null | undefined, decimals = 1): string => {
    if (num === null || num === undefined) return '0%';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
};

export const formatQuantity = (num: number | string | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

const currencySymbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
    KES: 'KSh',
    GHS: '₵',
    ZAR: 'R',
};

export const formatCurrency = (
    amount: number | string | null | undefined,
    currency: string = 'NGN',
    decimals: number = 2,
): string => {
    if (amount === null || amount === undefined) return `${currencySymbols[currency] || currency}0`;
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return `${currencySymbols[currency] || currency}0`;
    const symbol = currencySymbols[currency] || `${currency} `;
    return `${symbol}${value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
};

export const formatCurrencyCompact = (
    amount: number | string | null | undefined,
    currency: string = 'NGN',
): string => {
    if (amount === null || amount === undefined) return `${currencySymbols[currency] || currency}0`;
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return `${currencySymbols[currency] || currency}0`;
    const symbol = currencySymbols[currency] || `${currency} `;

    if (value >= 1000000) {
        return `${symbol}${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${symbol}${(value / 1000).toFixed(1)}K`;
    }
    return `${symbol}${value.toFixed(0)}`;
};

/**
 * Format duration in minutes to a human-readable string.
 * Examples: 30 -> "30 min", 60 -> "1 hr", 90 -> "1 hr 30 min"
 */
export const formatDuration = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined || minutes <= 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
};
