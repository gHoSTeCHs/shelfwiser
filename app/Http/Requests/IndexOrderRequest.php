<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(array_column(\App\Enums\OrderStatus::cases(), 'value'))],
            'payment_status' => ['nullable', 'string', Rule::in(array_column(\App\Enums\PaymentStatus::cases(), 'value'))],
        ];
    }
}
