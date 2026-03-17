<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSectionRequest extends FormRequest
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
            'config' => ['required', 'array', 'max:50'],
            'config.*' => ['nullable'],
            'variant' => ['nullable', 'string', 'max:50'],
        ];
    }
}
