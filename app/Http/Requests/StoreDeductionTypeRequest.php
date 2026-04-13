<?php

namespace App\Http\Requests;

use App\Enums\DeductionCalculationBase;
use App\Enums\DeductionCalculationType;
use App\Enums\DeductionCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeductionTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'category' => ['required', Rule::enum(DeductionCategory::class)],
            'calculation_type' => ['required', Rule::enum(DeductionCalculationType::class)],
            'calculation_base' => ['nullable', Rule::enum(DeductionCalculationBase::class)],
            'default_amount' => ['nullable', 'numeric', 'min:0'],
            'default_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'max_amount' => ['nullable', 'numeric', 'min:0'],
            'annual_cap' => ['nullable', 'numeric', 'min:0'],
            'is_pre_tax' => ['boolean'],
            'is_mandatory' => ['boolean'],
            'is_active' => ['boolean'],
            'priority' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'The deduction code is required.',
            'code.max' => 'The deduction code must not exceed 20 characters.',
            'name.required' => 'The deduction name is required.',
            'name.max' => 'The deduction name must not exceed 100 characters.',
            'category.required' => 'Please select a category.',
            'calculation_type.required' => 'Please select a calculation type.',
            'default_amount.min' => 'The default amount must be at least 0.',
            'default_rate.min' => 'The default rate must be at least 0.',
            'default_rate.max' => 'The default rate must not exceed 100.',
            'max_amount.min' => 'The maximum amount must be at least 0.',
            'annual_cap.min' => 'The annual cap must be at least 0.',
        ];
    }
}
