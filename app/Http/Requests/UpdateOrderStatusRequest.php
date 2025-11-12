<?php

namespace App\Http\Requests;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('order'));
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(OrderStatus::class)],
            'reason' => ['nullable', 'string', 'required_if:status,' . OrderStatus::CANCELLED->value],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Order status is required.',
            'reason.required_if' => 'Cancellation reason is required when cancelling an order.',
        ];
    }
}
