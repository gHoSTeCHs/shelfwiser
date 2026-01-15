import Button from '@/components/ui/button/Button';
import { CryptoPaymentProps } from '@/types/payment';
import { CheckCircle, Clock, Copy, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

/**
 * Cryptocurrency payment component.
 *
 * Displays wallet address, QR code, and countdown timer for
 * crypto payments. Handles expiration and provides copy functionality.
 */
const CryptoPayment: React.FC<CryptoPaymentProps> = ({
    paymentData,
    onExpired,
    onCancel,
}) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [copied, setCopied] = useState<boolean>(false);

    /**
     * Calculate and update remaining time
     */
    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = paymentData.expiresAt - now;
            return Math.max(0, remaining);
        };

        setTimeRemaining(calculateTimeRemaining());

        const interval = setInterval(() => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                onExpired();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [paymentData.expiresAt, onExpired]);

    /**
     * Format time remaining as MM:SS
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Copy wallet address to clipboard
     */
    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(paymentData.walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy address:', error);
        }
    };

    /**
     * Get color classes based on time remaining
     */
    const getTimerColorClass = (): string => {
        if (timeRemaining <= 60) {
            return 'text-red-600 dark:text-red-400';
        }
        if (timeRemaining <= 300) {
            return 'text-yellow-600 dark:text-yellow-400';
        }
        return 'text-green-600 dark:text-green-400';
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Send {paymentData.amount} {paymentData.currency}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    to the wallet address below
                </p>
            </div>

            {paymentData.qrCode && (
                <div className="flex justify-center">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                        <img
                            src={paymentData.qrCode}
                            alt="Payment QR Code"
                            className="h-48 w-48"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Wallet Address
                    </span>
                    <button
                        type="button"
                        onClick={copyAddress}
                        className="flex items-center text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                        {copied ? (
                            <>
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-1 h-4 w-4" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <p className="font-mono text-sm break-all text-gray-900 dark:text-white">
                    {paymentData.walletAddress}
                </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Clock
                            className={`mr-2 h-5 w-5 ${getTimerColorClass()}`}
                        />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Time Remaining
                        </span>
                    </div>
                    <span
                        className={`text-lg font-bold ${getTimerColorClass()}`}
                    >
                        {formatTime(timeRemaining)}
                    </span>
                </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Important:</strong> Please send the exact amount
                    shown above. The payment will be confirmed automatically
                    once the blockchain transaction is verified.
                </p>
            </div>

            <div className="flex justify-center">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    startIcon={<XCircle className="h-4 w-4" />}
                >
                    Cancel Payment
                </Button>
            </div>
        </div>
    );
};

export default CryptoPayment;
