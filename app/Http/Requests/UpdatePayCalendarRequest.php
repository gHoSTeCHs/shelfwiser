<?php

namespace App\Http\Requests;

use App\Enums\PayFrequency;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePayCalendarRequest extends FormRequest
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
            'frequency' => ['required', Rule::enum(PayFrequency::class)],
            'pay_day' => ['required', 'integer', 'min:1', 'max:31'],
            'cutoff_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The calendar name is required.',
            'name.max' => 'The calendar name must not exceed 100 characters.',
            'frequency.required' => 'Please select a pay frequency.',
            'pay_day.required' => 'The pay day is required.',
            'pay_day.min' => 'The pay day must be between 1 and 31.',
            'pay_day.max' => 'The pay day must be between 1 and 31.',
            'cutoff_day.min' => 'The cutoff day must be between 1 and 31.',
            'cutoff_day.max' => 'The cutoff day must be between 1 and 31.',
        ];
    }
}
