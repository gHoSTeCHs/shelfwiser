<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayrollReportFilterRequest extends FormRequest
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
            'period_id'    => ['nullable', 'integer', 'exists:payroll_periods,id'],
            'start_date'   => ['nullable', 'date_format:Y-m-d'],
            'end_date'     => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'shop_ids'     => ['nullable', 'array'],
            'shop_ids.*'   => ['integer', 'exists:shops,id'],
            'format'       => ['nullable', 'string', 'in:csv,excel,pdf,nibss'],
            'pay_run_id'   => ['nullable', 'integer', 'exists:pay_runs,id'],
        ];
    }
}
