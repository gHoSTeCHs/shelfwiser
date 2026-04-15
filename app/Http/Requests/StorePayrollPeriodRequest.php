<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePayrollPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['nullable', Rule::exists('shops', 'id')->where('tenant_id', $this->user()->tenant_id)],
            'period_name' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'payment_date' => ['required', 'date', 'after_or_equal:end_date'],
        ];
    }
}
