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

    public function messages(): array
    {
        return [
            'connection_approval_mode.required' => 'Please specify how you want to approve new buyer connections.',
            'lead_time_days.min' => 'Lead time must be at least 1 day.',
            'lead_time_days.max' => 'Lead time cannot exceed 365 days.',
            'minimum_order_value.min' => 'Minimum order value cannot be negative.',
            'payment_terms.max' => 'Payment terms cannot exceed 50 characters.',
        ];
    }
}
