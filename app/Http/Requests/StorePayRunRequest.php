<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePayRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'payroll_period_id' => ['required', 'integer', 'exists:payroll_periods,id,tenant_id,'.$tenantId],
            'pay_calendar_id' => ['nullable', 'integer', 'exists:pay_calendars,id,tenant_id,'.$tenantId],
            'name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
