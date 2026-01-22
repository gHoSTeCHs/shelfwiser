import { PaymentGateway, PaymentGatewaySelectorProps } from '@/types/payment';
import { Banknote, Bitcoin, Building, CreditCard, Wallet } from 'lucide-react';
import React from 'react';

/**
 * Payment gateway selector component.
 *
 * Displays available payment gateways as selectable cards with
 * icons and descriptions. Supports both online and offline payment methods.
 */
const PaymentGatewaySelector: React.FC<PaymentGatewaySelectorProps> = ({
    availableGateways,
    selectedGateway,
    onSelect,
    disabled = false,
    currency = 'NGN',
}) => {
    /**
     * Get icon component for a payment gateway
     */
    const getGatewayIcon = (identifier: string): React.ReactNode => {
        switch (identifier) {
            case 'paystack':
                return <CreditCard className="h-6 w-6" />;
            case 'opay':
                return <Wallet className="h-6 w-6" />;
            case 'flutterwave':
                return <CreditCard className="h-6 w-6" />;
            case 'crypto':
                return <Bitcoin className="h-6 w-6" />;
            case 'bank_transfer':
                return <Building className="h-6 w-6" />;
            case 'cash_on_delivery':
                return <Banknote className="h-6 w-6" />;
            default:
                return <CreditCard className="h-6 w-6" />;
        }
    };

    /**
     * Get description for a payment gateway
     */
    const getGatewayDescription = (gateway: PaymentGateway): string => {
        switch (gateway.identifier) {
            case 'paystack':
                return 'Pay securely with card, bank transfer, or USSD';
            case 'opay':
                return 'Pay with OPay wallet, card, or bank transfer';
            case 'flutterwave':
                return 'Multiple payment options including mobile money';
            case 'crypto':
                return 'Pay with Bitcoin, Ethereum, USDT, or other cryptocurrencies';
            case 'cash_on_delivery':
                return 'Pay with cash when your order is delivered';
            default:
                return gateway.name;
        }
    };

    /**
     * Filter gateways that support the current currency
     */
    const filteredGateways = availableGateways.filter(
        (gateway) =>
            gateway.isAvailable &&
            gateway.supportedCurrencies.includes(currency),
    );

    /**
     * Add cash on delivery as a default option
     */
    const allPaymentOptions: PaymentGateway[] = [
        ...filteredGateways,
        {
            identifier: 'cash_on_delivery',
            name: 'Cash on Delivery',
            description: 'Pay with cash when your order is delivered',
            isAvailable: true,
            supportedCurrencies: [
                'NGN',
                'USD',
                'EUR',
                'GBP',
                'GHS',
                'KES',
                'ZAR',
            ],
            supportsInline: false,
            supportsRefunds: false,
        },
    ];

    return (
        <div className="space-y-3">
            {allPaymentOptions.map((gateway) => (
                <button
                    key={gateway.identifier}
                    type="button"
                    onClick={() => onSelect(gateway.identifier)}
                    disabled={disabled}
                    className={`flex w-full items-start rounded-lg border-2 p-4 text-left transition-all ${
                        selectedGateway === gateway.identifier
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    <div
                        className={`flex-shrink-0 rounded-lg p-2 ${
                            selectedGateway === gateway.identifier
                                ? 'bg-brand-100 text-brand-600 dark:bg-brand-800 dark:text-brand-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                    >
                        {getGatewayIcon(gateway.identifier)}
                    </div>
                    <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {gateway.name}
                            </p>
                            {selectedGateway === gateway.identifier && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                                    <svg
                                        className="h-3 w-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {getGatewayDescription(gateway)}
                        </p>
                    </div>
                </button>
            ))}

            {allPaymentOptions.length === 0 && (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <p>No payment methods available for {currency}</p>
                </div>
            )}
        </div>
    );
};

export default PaymentGatewaySelector;
