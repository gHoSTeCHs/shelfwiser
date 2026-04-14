<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayRunIndexRequest extends FormRequest
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
            'status' => ['nullable', 'string'],
            'pay_calendar_id' => ['nullable', 'integer', 'exists:pay_calendars,id'],
            'search' => ['nullable', 'string', 'max:255'],
        ];
    }
}
