<?php

namespace App\Http\Requests\Supplier;

use App\Models\PurchaseOrder;
use App\Models\Shop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class CreatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Check if user can create purchase orders
        if (!Gate::allows('purchaseOrder.create', PurchaseOrder::class)) {
            return false;
        }

        // Validate shop belongs to user's tenant (defense in depth)
        $shopId = $this->input('shop_id');
        if ($shopId) {
            $shop = Shop::where('id', $shopId)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->first();

            if (!$shop) {
                return false;
            }
        }

        return true;
    }

    public function rules(): array
    {
        $tenantId = auth()->user()->tenant_id;
        $supplierTenantId = $this->input('supplier_tenant_id');

        return [
            'supplier_tenant_id' => ['bail', 'required', 'exists:tenants,id'],
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
            'items.required' => 'Purchase order must contain at least one item.',
            'items.*.catalog_item_id.exists' => 'Invalid catalog item selected.',
            'items.*.product_variant_id.exists' => 'Invalid product variant selected.',
            'shop_id.exists' => 'The selected shop does not exist or does not belong to your organization.',
        ];
    }
}
