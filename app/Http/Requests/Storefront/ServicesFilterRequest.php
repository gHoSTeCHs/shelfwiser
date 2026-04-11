<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ServicesFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'integer', 'exists:service_categories,id'],
            'sort' => ['nullable', 'string', 'in:name,price_low,price_high,newest'],
            'per_page' => ['nullable', 'integer', 'min:6', 'max:24'],
        ];
    }
}
