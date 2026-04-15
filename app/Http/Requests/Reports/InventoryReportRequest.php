<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class InventoryReportRequest extends FormRequest
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
            'category' => ['nullable', 'integer', 'exists:product_categories,id,tenant_id,'.$tenantId],
            'product' => ['nullable', 'integer', 'exists:products,id,tenant_id,'.$tenantId],
            'stock_status' => ['nullable', 'in:low,adequate,overstocked'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
