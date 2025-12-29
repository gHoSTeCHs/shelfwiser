<?php

namespace App\Http\Requests;

use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RecordOrderPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $order = $this->route('order');

        if (!$order instanceof Order) {
            return false;
        }

        return Gate::allows('create', [OrderPayment::class, $order]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['bail', 'required', 'numeric', 'min:0.01'],
            'payment_method' => ['bail', 'required', 'string', 'in:cash,card,bank_transfer,mobile_money,customer_credit'],
            'payment_date' => ['bail', 'required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $order = $this->route('order');

            if ($order instanceof Order && $this->filled('amount')) {
                $remainingBalance = $order->remainingBalance();

                if ($this->input('amount') > $remainingBalance) {
                    $validator->errors()->add(
                        'amount',
                        'Payment amount cannot exceed remaining balance of ₦' . number_format($remainingBalance, 2)
                    );
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'The payment amount is required.',
            'amount.numeric' => 'The payment amount must be a number.',
            'amount.min' => 'The payment amount must be at least ₦0.01.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.in' => 'The selected payment method is invalid.',
            'payment_date.required' => 'The payment date is required.',
            'payment_date.date' => 'Please provide a valid date.',
            'reference_number.max' => 'The reference number cannot exceed 255 characters.',
            'notes.max' => 'The notes cannot exceed 1000 characters.',
        ];
    }
}
