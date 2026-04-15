<?php

namespace App\Http\Requests;

use App\Enums\PayRunStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'status' => ['nullable', Rule::enum(PayRunStatus::class)],
            'pay_calendar_id' => ['nullable', 'integer', 'exists:pay_calendars,id,tenant_id,'.$this->user()->tenant_id],
            'search' => ['nullable', 'string', 'max:255'],
        ];
    }
}
