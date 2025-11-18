/**
 * Payment Gateway Types
 *
 * Type definitions for payment gateway integration including
 * Paystack, OPay, Flutterwave, and cryptocurrency payments.
 */

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
    metadata?: Record<string, any>;
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
    icon: React.ReactNode;
    isOnline: boolean;
    gateway?: string;
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
    metadata?: Record<string, any>;
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
