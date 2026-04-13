<?php

namespace App\Http\Requests\Reports;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Foundation\Http\FormRequest;

class SalesReportRequest extends FormRequest
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
            'customer' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'in:'.implode(',', array_column(OrderStatus::cases(), 'value'))],
            'payment_status' => ['nullable', 'in:'.implode(',', array_column(PaymentStatus::cases(), 'value'))],
            'group_by' => ['nullable', 'in:order,product,customer,shop,day'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
