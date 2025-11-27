import React, { useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import { PaystackPaymentProps, PaystackCallbackResponse } from '@/types/payment';

/**
 * Paystack inline payment button component.
 *
 * Loads the Paystack inline script and handles the payment flow
 * with callbacks for success and close events.
 */
const PaystackButton: React.FC<PaystackPaymentProps> = ({
    email,
    amount,
    currency,
    reference,
    publicKey,
    onSuccess,
    onClose,
    metadata = {},
    channels = ['card', 'bank', 'ussd', 'bank_transfer'],
    label = 'Pay Now',
    disabled = false,
}) => {
    /**
     * Load Paystack inline script on mount
     */
    useEffect(() => {
        const existingScript = document.getElementById('paystack-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'paystack-script';
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            document.body.appendChild(script);
        }

        return () => {
            /**
             * Cleanup is handled by the document to avoid
             * removing script that other components might need
             */
        };
    }, []);

    /**
     * Handle payment button click
     * Opens the Paystack payment popup
     */
    const handlePayment = () => {
        if (!window.PaystackPop) {
            console.error('Paystack script not loaded');
            return;
        }

        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: amount,
            currency: currency,
            ref: reference,
            metadata: {
                custom_fields: [
                    {
                        display_name: 'Order Reference',
                        variable_name: 'order_reference',
                        value: reference,
                    },
                    ...Object.entries(metadata).map(([key, value]) => ({
                        display_name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                        variable_name: key,
                        value: String(value),
                    })),
                ],
            },
            channels: channels,
            callback: (response: PaystackCallbackResponse) => {
                onSuccess(response);
            },
            onClose: () => {
                onClose();
            },
        });

        handler.openIframe();
    };

    /**
     * Format amount for display (convert from kobo to naira)
     */
    const formatAmount = (amountInKobo: number, curr: string): string => {
        const amountInMajor = amountInKobo / 100;
        const formatter = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2,
        });
        return formatter.format(amountInMajor);
    };

    return (
        <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handlePayment}
            disabled={disabled}
        >
            {label} - {formatAmount(amount, currency)}
        </Button>
    );
};

export default PaystackButton;
