/**
 * Payment Gateway Types
 *
 * Type definitions for payment gateway integration including
 * Paystack, OPay, Flutterwave, and cryptocurrency payments.
 */

import type { ReactNode } from 'react';

export interface PaymentGateway {
    identifier: string;
    name: string;
    description: string;
    icon?: string;
    isAvailable: boolean;
    supportedCurrencies: string[];
    supportsInline: boolean;
    supportsRefunds: boolean;
}

export type PaymentMetadataValue = string | number | boolean | null;

export interface PaymentInitiationResult {
    success: boolean;
    reference: string;
    authorizationUrl?: string;
    accessCode?: string;
    inlineData?: PaystackInlineData;
    walletAddress?: string;
    cryptoAmount?: number;
    cryptoCurrency?: string;
    qrCode?: string;
    expiresAt?: number;
    errorMessage?: string;
    metadata?: Record<string, PaymentMetadataValue>;
}

export interface PaystackInlineData {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    onClose?: () => void;
    callback?: (response: PaystackCallbackResponse) => void;
}

export interface PaystackCallbackResponse {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    trxref: string;
    message: string;
}

export interface PaymentVerificationResult {
    success: boolean;
    reference: string;
    amount?: number;
    currency?: string;
    gatewayReference?: string;
    paymentMethod?: string;
    channel?: string;
    gatewayFee?: number;
    paidAt?: string;
    errorMessage?: string;
    isPending?: boolean;
}

export interface CryptoPaymentData {
    walletAddress: string;
    amount: number;
    currency: string;
    qrCode?: string;
    expiresAt: number;
    paymentId?: string;
}

export type PaymentMethod =
    | 'cash_on_delivery'
    | 'paystack'
    | 'opay'
    | 'flutterwave'
    | 'crypto'
    | 'bank_transfer';

export interface PaymentOption {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: ReactNode;
    isOnline: boolean;
    gateway?: string;
}

/**
 * Internal Payment Methods (POS, Order Payments)
 * These map to the PHP PaymentMethod enum.
 */
export type InternalPaymentMethod =
    | 'cash'
    | 'card'
    | 'mobile_money'
    | 'bank_transfer'
    | 'cheque'
    | 'customer_credit';

export interface InternalPaymentMethodOption {
    value: InternalPaymentMethod;
    label: string;
    description?: string;
    color?: string;
    icon?: string;
    requiresReference?: boolean;
    isInstant?: boolean;
}

export const INTERNAL_PAYMENT_METHODS: Record<InternalPaymentMethod, InternalPaymentMethodOption> = {
    cash: {
        value: 'cash',
        label: 'Cash',
        description: 'Physical cash payment',
        color: 'success',
        icon: 'banknote',
        requiresReference: false,
        isInstant: true,
    },
    card: {
        value: 'card',
        label: 'Card',
        description: 'Credit or debit card payment',
        color: 'primary',
        icon: 'credit-card',
        requiresReference: true,
        isInstant: true,
    },
    mobile_money: {
        value: 'mobile_money',
        label: 'Mobile Money',
        description: 'Mobile money transfer (M-Pesa, etc.)',
        color: 'warning',
        icon: 'smartphone',
        requiresReference: true,
        isInstant: true,
    },
    bank_transfer: {
        value: 'bank_transfer',
        label: 'Bank Transfer',
        description: 'Direct bank transfer or wire',
        color: 'info',
        icon: 'building-2',
        requiresReference: true,
        isInstant: false,
    },
    cheque: {
        value: 'cheque',
        label: 'Cheque',
        description: 'Payment by cheque',
        color: 'gray',
        icon: 'file-text',
        requiresReference: true,
        isInstant: false,
    },
    customer_credit: {
        value: 'customer_credit',
        label: 'Customer Credit',
        description: 'Payment from customer credit balance',
        color: 'purple',
        icon: 'wallet',
        requiresReference: false,
        isInstant: true,
    },
};

export const POS_PAYMENT_METHODS: InternalPaymentMethod[] = [
    'cash',
    'card',
    'mobile_money',
    'bank_transfer',
];

export function getInternalPaymentMethodLabel(method: InternalPaymentMethod): string {
    return INTERNAL_PAYMENT_METHODS[method]?.label ?? method;
}

export function getInternalPaymentMethodColor(method: InternalPaymentMethod): string {
    return INTERNAL_PAYMENT_METHODS[method]?.color ?? 'gray';
}

/**
 * Props for the PaymentGatewaySelector component
 */
export interface PaymentGatewaySelectorProps {
    availableGateways: PaymentGateway[];
    selectedGateway: string | null;
    onSelect: (gateway: string) => void;
    disabled?: boolean;
    currency?: string;
}

/**
 * Props for the PaystackPayment component
 */
export interface PaystackPaymentProps {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    publicKey: string;
    onSuccess: (response: PaystackCallbackResponse) => void;
    onClose: () => void;
    metadata?: Record<string, PaymentMetadataValue>;
    channels?: string[];
    label?: string;
    disabled?: boolean;
}

/**
 * Props for the CryptoPayment component
 */
export interface CryptoPaymentProps {
    paymentData: CryptoPaymentData;
    onExpired: () => void;
    onCancel: () => void;
}

/**
 * Declare Paystack global for inline integration
 */
declare global {
    interface Window {
        PaystackPop: {
            setup: (options: PaystackInlineData) => {
                openIframe: () => void;
            };
        };
    }
}
