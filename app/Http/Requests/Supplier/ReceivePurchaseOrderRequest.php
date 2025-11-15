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
}
