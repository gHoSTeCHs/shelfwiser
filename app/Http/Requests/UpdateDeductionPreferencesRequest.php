<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeductionPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pension_enabled' => ['nullable', 'boolean'],
            'nhf_enabled' => ['nullable', 'boolean'],
            'nhis_enabled' => ['nullable', 'boolean'],
            'nhis_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
