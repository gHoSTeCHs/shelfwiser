<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClockInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'exists:shops,id'],
            'clock_in' => ['nullable', 'date'],
        ];
    }
}
