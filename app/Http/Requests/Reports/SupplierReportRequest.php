<?php

namespace App\Http\Requests\Reports;

use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use Illuminate\Foundation\Http\FormRequest;

class SupplierReportRequest extends FormRequest
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
            'supplier' => ['nullable', 'integer', 'exists:tenants,id'],
            'status' => ['nullable', 'in:'.implode(',', array_column(PurchaseOrderStatus::cases(), 'value'))],
            'payment_status' => ['nullable', 'in:'.implode(',', array_column(PurchaseOrderPaymentStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
