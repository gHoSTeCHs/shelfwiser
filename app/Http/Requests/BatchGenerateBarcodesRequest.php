<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchGenerateBarcodesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'variant_ids' => ['required', 'array'],
            'variant_ids.*' => ['integer', 'exists:product_variants,id'],
        ];
    }
}
