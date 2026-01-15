<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ReceivePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('receive', $this->route('purchaseOrder'));
    }

    public function rules(): array
    {
        return [
            'actual_delivery_date' => ['nullable', 'date', 'before_or_equal:today'],
            'items' => ['sometimes', 'array'],
            'items.*.received_quantity' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'actual_delivery_date.before_or_equal' => 'Delivery date cannot be in the future.',
            'items.*.received_quantity.required' => 'Please specify the quantity received for each item.',
            'items.*.received_quantity.min' => 'Received quantity cannot be negative.',
        ];
    }
}
