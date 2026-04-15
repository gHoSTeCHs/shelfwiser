<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class ProductProfitabilityReportRequest extends FormRequest
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
            'category' => ['nullable', 'integer', 'exists:product_categories,id,tenant_id,'.$tenantId],
            'product' => ['nullable', 'integer', 'exists:products,id,tenant_id,'.$tenantId],
            'sort_by' => ['nullable', 'in:profit,margin,revenue,quantity'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
