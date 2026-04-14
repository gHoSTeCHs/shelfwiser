<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClockOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clock_out' => ['nullable', 'date'],
        ];
    }
}
