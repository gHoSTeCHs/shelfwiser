<?php

namespace App\Http\Requests;

use App\Enums\InventoryModel;
use App\Models\ShopType;
use App\Services\ShopConfigHandlerFactory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

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
            'inventory_model' => ['sometimes', 'required', Rule::enum(InventoryModel::class)],
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
                if (! $handler->validate($value)) {
                    $fail('Configuration validation failed for shop type: '.$shopType->label);
                }
            }];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please provide a name for this shop.',
            'name.max' => 'Shop name cannot exceed 255 characters.',
            'city.required' => 'Please specify the city where this shop is located.',
            'state.required' => 'Please specify the state where this shop is located.',
            'country.required' => 'Please specify the country where this shop is located.',
            'email.email' => 'Please provide a valid email address for this shop.',
            'phone.max' => 'Phone number cannot exceed 255 characters.',
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
