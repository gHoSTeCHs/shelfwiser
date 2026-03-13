export function formatCurrency(
    amount: number,
    symbol: string,
    decimals: number,
): string {
    const formatted = amount.toLocaleString('en-NG', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return `${symbol}${formatted}`;
}

export function formatCompactNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
}
