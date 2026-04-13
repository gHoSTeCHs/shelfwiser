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
        return [
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'stock_status' => ['nullable', 'in:low,adequate,overstocked'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
