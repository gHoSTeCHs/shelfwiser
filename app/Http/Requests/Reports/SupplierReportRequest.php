<?php

namespace App\Http\Requests\Reports;

use App\Enums\ConnectionStatus;
use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $tenantId = $this->user()->tenant_id;

        return [
            'shop' => ['nullable', 'integer', 'exists:shops,id,tenant_id,'.$tenantId],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'supplier' => [
                'nullable',
                'integer',
                Rule::exists('supplier_connections', 'supplier_tenant_id')
                    ->where('buyer_tenant_id', $tenantId)
                    ->whereIn('status', [ConnectionStatus::APPROVED->value, ConnectionStatus::ACTIVE->value]),
            ],
            'status' => ['nullable', 'in:'.implode(',', array_column(PurchaseOrderStatus::cases(), 'value'))],
            'payment_status' => ['nullable', 'in:'.implode(',', array_column(PurchaseOrderPaymentStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ];
    }
}
