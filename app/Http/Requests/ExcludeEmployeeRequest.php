<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExcludeEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.max' => 'The reason must not exceed 500 characters.',
        ];
    }
}
