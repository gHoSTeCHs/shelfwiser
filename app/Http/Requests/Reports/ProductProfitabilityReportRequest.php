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
        return [
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'sort_by' => ['nullable', 'in:profit,margin,revenue,quantity'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
