<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWageAdvanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['required', Rule::exists('shops', 'id')->where('tenant_id', $this->user()->tenant_id)],
            'amount_requested' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:500'],
            'repayment_installments' => ['required', 'integer', 'min:1', 'max:12'],
        ];
    }
}
