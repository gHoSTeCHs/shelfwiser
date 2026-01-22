<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('recordPayment', $this->route('purchaseOrder'));
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'string', 'max:50'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Please enter the payment amount.',
            'amount.min' => 'Payment amount must be at least 0.01.',
            'payment_date.required' => 'Please specify when the payment was made.',
            'payment_date.before_or_equal' => 'Payment date cannot be in the future.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.max' => 'Payment method cannot exceed 50 characters.',
            'reference_number.max' => 'Reference number cannot exceed 100 characters.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
        ];
    }
}
