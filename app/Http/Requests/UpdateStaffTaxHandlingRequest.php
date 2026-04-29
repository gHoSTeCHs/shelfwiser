<?php

namespace App\Http\Requests;

use App\Enums\TaxHandling;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffTaxHandlingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enable_tax_calculations' => ['required', 'boolean'],
            'tax_handling' => ['required', Rule::enum(TaxHandling::class)],
            'tax_id_number' => ['nullable', 'string', 'max:255'],
        ];
    }
}
