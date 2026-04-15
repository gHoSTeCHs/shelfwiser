<?php

namespace App\Http\Requests\Supplier;

use App\Enums\ConnectionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = auth()->user()->tenant_id;
        $supplierTenantId = $this->input('supplier_tenant_id');

        return [
            'supplier_tenant_id' => [
                'bail',
                'required',
                'integer',
                Rule::exists('supplier_connections', 'supplier_tenant_id')
                    ->where('buyer_tenant_id', $tenantId)
                    ->whereIn('status', [ConnectionStatus::APPROVED->value, ConnectionStatus::ACTIVE->value]),
            ],
            'shop_id' => [
                'bail',
                'required',
                Rule::exists('shops', 'id')->where(function ($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                }),
            ],
            'expected_delivery_date' => ['nullable', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['bail', 'required', 'array', 'min:1'],
            'items.*.catalog_item_id' => [
                'bail',
                'required',
                Rule::exists('supplier_catalog_items', 'id')->where(function ($query) use ($supplierTenantId) {
                    if ($supplierTenantId) {
                        $query->where('supplier_tenant_id', $supplierTenantId);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                }),
            ],
            'items.*.quantity' => ['bail', 'required', 'integer', 'min:1'],
            'items.*.unit_price' => ['bail', 'required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'supplier_tenant_id.required' => 'Please select a supplier for this purchase order.',
            'supplier_tenant_id.exists' => 'The selected supplier is not an approved supplier for your organization.',
            'shop_id.required' => 'Please select which shop will receive this order.',
            'shop_id.exists' => 'The selected shop does not exist or does not belong to your organization.',
            'expected_delivery_date.after' => 'Expected delivery date must be in the future.',
            'notes.max' => 'Notes cannot exceed 1000 characters.',
            'items.required' => 'Purchase order must contain at least one item.',
            'items.min' => 'Please add at least one item to this purchase order.',
            'items.*.catalog_item_id.required' => 'Please select a product for each line item.',
            'items.*.catalog_item_id.exists' => 'One or more selected products are not available from this supplier.',
            'items.*.quantity.required' => 'Please specify the quantity for each item.',
            'items.*.quantity.min' => 'Item quantity must be at least 1.',
            'items.*.unit_price.required' => 'Please specify the unit price for each item.',
            'items.*.unit_price.min' => 'Unit price cannot be negative.',
        ];
    }
}
