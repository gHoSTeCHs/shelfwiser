import OrderPaymentController from '@/actions/App/Http/Controllers/OrderPaymentController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { Form } from '@inertiajs/react';
import { useState } from 'react';

interface RecordPaymentProps {
    orderId: number;
    remainingBalance: number;
    onSuccess?: () => void;
}

export default function RecordPayment({
    orderId,
    remainingBalance,
    onSuccess,
}: RecordPaymentProps) {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');

    const paymentMethods = [
        { value: '', label: 'Select payment method' },
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'mobile_money', label: 'Mobile Money' },
        { value: 'customer_credit', label: 'Customer Credit' },
    ];

    return (
        <Card
            title="Record Payment"
            description={`Remaining Balance: ${formatCurrency(remainingBalance)}`}
        >
            <Form
                action={OrderPaymentController.store.url({ order: orderId })}
                method="post"
                onSuccess={onSuccess}
            >
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="amount">
                                Amount <span className="text-error-500">*</span>
                            </Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={remainingBalance}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                error={!!errors.amount}
                                placeholder="0.00"
                                required
                            />
                            <InputError message={errors.amount} />
                        </div>

                        <div>
                            <Label htmlFor="payment_method">
                                Payment Method{' '}
                                <span className="text-error-500">*</span>
                            </Label>
                            <Select
                                options={paymentMethods}
                                value={paymentMethod}
                                onChange={(value) => setPaymentMethod(value)}
                            />
                            <input
                                type="hidden"
                                name="payment_method"
                                value={paymentMethod}
                            />
                            <InputError message={errors.payment_method} />
                        </div>

                        <div>
                            <Label htmlFor="payment_date">
                                Payment Date{' '}
                                <span className="text-error-500">*</span>
                            </Label>
                            <Input
                                id="payment_date"
                                name="payment_date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                error={!!errors.payment_date}
                                required
                            />
                            <InputError message={errors.payment_date} />
                        </div>

                        {(paymentMethod === 'bank_transfer' ||
                            paymentMethod === 'mobile_money') && (
                            <div>
                                <Label htmlFor="reference_number">
                                    Reference Number
                                </Label>
                                <Input
                                    id="reference_number"
                                    name="reference_number"
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) =>
                                        setReferenceNumber(e.target.value)
                                    }
                                    error={!!errors.reference_number}
                                    placeholder="TRF-123456789"
                                />
                                <InputError message={errors.reference_number} />
                            </div>
                        )}

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <TextArea
                                id="notes"
                                name="notes"
                                value={notes}
                                onChange={(value) => setNotes(value)}
                                error={!!errors.notes}
                                placeholder="Optional notes about this payment"
                                rows={3}
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={
                                    processing || !amount || !paymentMethod
                                }
                                loading={processing}
                            >
                                Record Payment
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </Card>
    );
}
