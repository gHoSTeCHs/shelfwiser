<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectPayRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Please provide a reason for rejecting this pay run.',
            'reason.max' => 'The reason must not exceed 500 characters.',
        ];
    }
}
