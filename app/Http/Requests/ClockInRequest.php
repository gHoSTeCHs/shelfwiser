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
            'shop_id' => ['required', 'integer', 'exists:shops,id,tenant_id,'.$this->user()->tenant_id],
            'clock_in' => ['nullable', 'date'],
        ];
    }
}
