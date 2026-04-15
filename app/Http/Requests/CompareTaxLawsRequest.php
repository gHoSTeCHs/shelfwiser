<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompareTaxLawsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'annual_salary' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
        ];
    }
}
