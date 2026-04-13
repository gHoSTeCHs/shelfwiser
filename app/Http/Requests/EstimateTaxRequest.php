<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EstimateTaxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'annual_salary' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['nullable', 'date'],
        ];
    }
}
