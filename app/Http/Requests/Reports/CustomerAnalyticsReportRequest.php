<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class CustomerAnalyticsReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'shop' => ['nullable', 'integer', 'exists:shops,id,tenant_id,'.$tenantId],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'customer' => ['nullable', 'integer', 'exists:customers,id,tenant_id,'.$tenantId],
            'segment' => ['nullable', 'in:all,high_value,at_risk,inactive'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
