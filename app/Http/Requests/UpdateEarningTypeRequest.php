<?php

namespace App\Http\Requests;

use App\Enums\EarningCalculationType;
use App\Enums\EarningCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEarningTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'category' => ['required', Rule::enum(EarningCategory::class)],
            'calculation_type' => ['required', Rule::enum(EarningCalculationType::class)],
            'default_amount' => ['nullable', 'numeric', 'min:0'],
            'default_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_taxable' => ['boolean'],
            'is_pensionable' => ['boolean'],
            'is_recurring' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The earning name is required.',
            'name.max' => 'The earning name must not exceed 100 characters.',
            'category.required' => 'Please select a category.',
            'calculation_type.required' => 'Please select a calculation type.',
            'default_amount.min' => 'The default amount must be at least 0.',
            'default_rate.min' => 'The default rate must be at least 0.',
            'default_rate.max' => 'The default rate must not exceed 100.',
        ];
    }
}
