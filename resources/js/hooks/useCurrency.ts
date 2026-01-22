/**
 * Hook for shop-aware currency formatting.
 * Use this in components that receive shop as props.
 * For standalone formatting without shop context, use formatCurrency from @/lib/formatters.
 *
 * This hook delegates to centralized formatters where possible while maintaining
 * support for shop-specific currency symbols (which may not be in the standard symbol map).
 */

import { formatNumber as baseFormatNumber } from '@/lib/formatters';

export interface CurrencyConfig {
    currency: string;
    currency_symbol: string;
    currency_decimals: number;
}

export interface UseCurrencyOptions {
    currency?: string;
    symbol?: string;
    decimals?: number;
}

const defaultConfig: CurrencyConfig = {
    currency: 'NGN',
    currency_symbol: '₦',
    currency_decimals: 2,
};

export function useCurrency(shop?: Partial<CurrencyConfig> | null, options?: UseCurrencyOptions) {
    const config: CurrencyConfig = {
        currency: options?.currency || shop?.currency || defaultConfig.currency,
        currency_symbol: options?.symbol || shop?.currency_symbol || defaultConfig.currency_symbol,
        currency_decimals: options?.decimals ?? shop?.currency_decimals ?? defaultConfig.currency_decimals,
    };

    const formatCurrency = (amount: number | string | null | undefined): string => {
        if (amount === null || amount === undefined) return `${config.currency_symbol}0`;
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value)) return `${config.currency_symbol}0`;
        return `${config.currency_symbol}${baseFormatNumber(value, config.currency_decimals)}`;
    };

    const formatNumber = (amount: number | string | null | undefined, decimals?: number): string => {
        return baseFormatNumber(amount, decimals ?? config.currency_decimals);
    };

    const formatCompact = (amount: number | string | null | undefined): string => {
        if (amount === null || amount === undefined) return `${config.currency_symbol}0`;
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value)) return `${config.currency_symbol}0`;

        if (value >= 1000000) {
            return `${config.currency_symbol}${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${config.currency_symbol}${(value / 1000).toFixed(1)}K`;
        }
        return `${config.currency_symbol}${value.toFixed(0)}`;
    };

    return {
        formatCurrency,
        formatNumber,
        formatCompact,
        currency: config.currency,
        symbol: config.currency_symbol,
        decimals: config.currency_decimals,
    };
}

export default useCurrency;
