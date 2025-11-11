<?php

namespace App\Http\Requests;

use App\Models\Shop;
use App\Models\ShopType;
use App\Services\ShopConfigHandlerFactory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Cache;

class UpdateShopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('shop'));
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'city' => ['sometimes', 'required', 'string', 'max:255'],
            'state' => ['sometimes', 'required', 'string', 'max:255'],
            'country' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];

        if ($this->has('config') && $this->has('shop_type_slug')) {
            $shopType = $this->getShopType();
            $rules['config'] = ['required', 'array', function ($attribute, $value, $fail) use ($shopType) {
                $handler = ShopConfigHandlerFactory::make($shopType);
                if (!$handler->validate($value)) {
                    $fail('Configuration validation failed for shop type: ' . $shopType->label);
                }
            }];
        }

        return $rules;
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
