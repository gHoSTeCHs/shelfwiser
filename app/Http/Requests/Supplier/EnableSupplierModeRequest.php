<?php

namespace App\Http\Requests\Supplier;

use App\Enums\ConnectionApprovalMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class EnableSupplierModeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('enableSupplierMode', [auth()->user()->tenant, auth()->user()->tenant]);
    }

    public function rules(): array
    {
        return [
            'business_registration' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:255'],
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'lead_time_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'minimum_order_value' => ['nullable', 'numeric', 'min:0'],
            'connection_approval_mode' => ['required', Rule::enum(ConnectionApprovalMode::class)],
            'settings' => ['nullable', 'array'],
        ];
    }
}
