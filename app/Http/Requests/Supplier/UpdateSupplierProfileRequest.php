<?php

namespace App\Http\Requests\Supplier;

use App\Enums\ConnectionApprovalMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateSupplierProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('updateProfile', $this->route('profile'));
    }

    public function rules(): array
    {
        return [
            'business_registration' => ['sometimes', 'nullable', 'string', 'max:255'],
            'tax_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'payment_terms' => ['sometimes', 'string', 'max:50'],
            'lead_time_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'minimum_order_value' => ['sometimes', 'numeric', 'min:0'],
            'connection_approval_mode' => ['sometimes', Rule::enum(ConnectionApprovalMode::class)],
            'settings' => ['sometimes', 'nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'business_registration.max' => 'Business registration number cannot exceed 255 characters.',
            'tax_id.max' => 'Tax ID cannot exceed 255 characters.',
            'payment_terms.max' => 'Payment terms cannot exceed 50 characters.',
            'lead_time_days.min' => 'Lead time must be at least 1 day.',
            'lead_time_days.max' => 'Lead time cannot exceed 365 days.',
            'minimum_order_value.min' => 'Minimum order value cannot be negative.',
        ];
    }
}
