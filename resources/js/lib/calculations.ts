/**
 * Centralized calculation utilities for orders, payments, and financial operations.
 * This is the SINGLE SOURCE OF TRUTH for common calculations.
 * DO NOT create local calculateSubtotal or calculateTotal functions in components.
 */

export interface LineItem {
    quantity: number;
    unit_price: number;
}

export interface TaxableLineItem extends LineItem {
    is_taxable?: boolean;
}

/**
 * Calculate subtotal from an array of line items.
 * @param items Array of items with quantity and unit_price
 * @returns Sum of (quantity * unit_price) for all items
 */
export const calculateSubtotal = <T extends LineItem>(items: T[]): number => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
};

/**
 * Calculate tax amount for taxable items.
 * @param items Array of items with quantity, unit_price, and optionally is_taxable
 * @param taxRate Tax rate as percentage (e.g., 7.5 for 7.5%)
 * @param vatEnabled Whether VAT/tax is enabled
 * @returns Total tax amount
 */
export const calculateTax = <T extends TaxableLineItem>(
    items: T[],
    taxRate: number,
    vatEnabled = true,
): number => {
    if (!vatEnabled || taxRate <= 0) return 0;
    return items.reduce((sum, item) => {
        if (item.is_taxable === false) return sum;
        return sum + item.quantity * item.unit_price * (taxRate / 100);
    }, 0);
};

/**
 * Calculate total with optional additions and deductions.
 * @param subtotal Base subtotal amount
 * @param additions Object with optional tax, shipping, etc. to add
 * @param deductions Object with optional discount, etc. to subtract
 * @returns Final total (minimum 0)
 */
export const calculateTotal = (
    subtotal: number,
    additions: { tax?: number; shipping?: number } = {},
    deductions: { discount?: number } = {},
): number => {
    const totalAdditions = (additions.tax || 0) + (additions.shipping || 0);
    const totalDeductions = deductions.discount || 0;
    return Math.max(0, subtotal + totalAdditions - totalDeductions);
};

/**
 * Calculate change due for cash payments.
 * @param amountTendered Amount given by customer
 * @param total Total amount due
 * @returns Change due (minimum 0)
 */
export const calculateChange = (amountTendered: number, total: number): number => {
    return Math.max(0, amountTendered - total);
};

/**
 * Calculate available credit for a customer.
 * @param creditLimit Maximum credit allowed
 * @param currentBalance Current outstanding balance
 * @returns Available credit amount (minimum 0)
 */
export const calculateAvailableCredit = (creditLimit: number, currentBalance: number): number => {
    return Math.max(0, creditLimit - currentBalance);
};

/**
 * Calculate installment amount for loan/advance repayment.
 * @param totalAmount Total amount to be repaid
 * @param numberOfInstallments Number of installments
 * @param decimals Number of decimal places (default 2)
 * @returns Amount per installment
 */
export const calculateInstallmentAmount = (
    totalAmount: number,
    numberOfInstallments: number,
    decimals = 2,
): number => {
    if (numberOfInstallments <= 0) return totalAmount;
    return Number((totalAmount / numberOfInstallments).toFixed(decimals));
};

/**
 * Calculate percentage (e.g., credit usage percentage).
 * @param value Current value
 * @param total Total/maximum value
 * @returns Percentage (0-100, or higher if over limit)
 */
export const calculatePercentage = (value: number, total: number): number => {
    if (total <= 0) return 0;
    return (value / total) * 100;
};
