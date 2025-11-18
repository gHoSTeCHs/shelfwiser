<?php

namespace App\Http\Requests;

use App\Enums\InventoryModel;
use App\Models\Shop;
use App\Models\ShopType;
use App\Services\ShopConfigHandlerFactory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class CreateShopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Shop::class);
    }

    public function rules(): array
    {
        $shopType = $this->getShopType();

        return [
            'name' => ['required', 'string', 'max:255'],
            'shop_type_slug' => ['required', 'exists:shop_types,slug'],
            'inventory_model' => ['required', Rule::enum(InventoryModel::class)],
            'address' => ['nullable', 'string'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'config' => ['required', 'array', function ($attribute, $value, $fail) use ($shopType) {
                $handler = ShopConfigHandlerFactory::make($shopType);
                if (! $handler->validate($value)) {
                    $fail('Configuration validation failed for shop type: '.$shopType->label);
                }
            }],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function getShopType(): ShopType
    {
        $tenantId = $this->user()->tenant_id;
        $slug = $this->input('shop_type_slug');

        $cacheKey = "tenant:{$tenantId}:shop_type:slug:{$slug}";

        return Cache::tags(["tenant:{$tenantId}:shop_types"])
            ->remember($cacheKey, 3600, function () use ($tenantId, $slug) {
                return ShopType::accessibleTo($tenantId)
                    ->where('slug', $slug)
                    ->firstOrFail();
            });
    }
}
