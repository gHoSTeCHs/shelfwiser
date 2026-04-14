<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartBreakRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'break_start' => ['nullable', 'date'],
        ];
    }
}
