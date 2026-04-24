<?php

namespace App\Http\Requests;

use App\Enums\PayRunStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'period_id' => ['nullable', 'integer', Rule::exists('payroll_periods', 'id')->where('tenant_id', $this->user()->tenant_id)],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'shop_ids' => ['nullable', 'array'],
            'shop_ids.*' => ['integer', Rule::exists('shops', 'id')->where('tenant_id', $this->user()->tenant_id)],
            'format' => ['nullable', 'string', 'in:csv,excel,pdf,nibss'],
            'pay_run_id' => ['nullable', 'integer', Rule::exists('pay_runs', 'id')->where('tenant_id', $this->user()->tenant_id)->whereIn('status', [PayRunStatus::APPROVED->value, PayRunStatus::PROCESSING->value, PayRunStatus::COMPLETED->value])],
        ];
    }
}
