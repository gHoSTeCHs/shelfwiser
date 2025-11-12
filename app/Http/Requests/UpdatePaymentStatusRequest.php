<?php

namespace App\Http\Requests;

use App\Enums\PaymentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('order'));
    }

    public function rules(): array
    {
        return [
            'payment_status' => ['required', Rule::enum(PaymentStatus::class)],
            'payment_method' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_status.required' => 'Payment status is required.',
        ];
    }
}
